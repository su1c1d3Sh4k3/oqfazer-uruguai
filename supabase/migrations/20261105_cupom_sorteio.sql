-- =============================================
-- 2026-11-05 — Cupom de restaurante (sorteio)
-- Conta 'voucher': nasce de um convite, vê os restaurantes como visitante e
-- tem direito a UM check-in, só no restaurante do cupom, até a validade.
-- Depois disso continua navegando, mas sem check-in (convite para assinar).
-- O check-in do cupom só acontece pela RPC use_voucher — gravação direta em
-- access_records é bloqueada para essa role. Idempotente.
-- =============================================

-- ---------------------------------------------
-- 1. Nova role
-- ---------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'establishment', 'admin', 'agency', 'voucher'));

ALTER TABLE public.invites DROP CONSTRAINT IF EXISTS invites_role_check;
ALTER TABLE public.invites ADD CONSTRAINT invites_role_check
  CHECK (role IN ('user', 'establishment', 'agency', 'voucher'));

-- ---------------------------------------------
-- 2. Dados do cupom — no convite (definidos pelo admin) e copiados para o
-- perfil quando a conta é criada.
-- voucher_discount NULL = desconto padrão do restaurante (com as regras de
--   horário dele); texto = desconto específico (ex.: "20% OFF").
-- voucher_hours_only: desconto específico só nos horários de desconto do lugar.
-- ---------------------------------------------
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS voucher_place_id TEXT REFERENCES public.places(id) ON DELETE SET NULL;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS voucher_discount TEXT;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS voucher_hours_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS voucher_expires_at TIMESTAMPTZ;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voucher_place_id TEXT REFERENCES public.places(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voucher_discount TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voucher_hours_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voucher_expires_at BIGINT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voucher_used_at BIGINT;

-- ---------------------------------------------
-- 3. Proteção do perfil: usuário não altera os dados do cupom.
-- Quando o admin transforma a conta cupom em usuário comum (assinatura), os
-- 20 dias passam a contar do próximo acesso, não do login do cupom.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.is_admin() THEN
    NEW.id := OLD.id;
    NEW.role := OLD.role;
    NEW.managed_place_id := OLD.managed_place_id;
    NEW.first_login_at := OLD.first_login_at;
    NEW.first_access_at := OLD.first_access_at;
    NEW.trial_from_first_access := OLD.trial_from_first_access;
    NEW.account_status := OLD.account_status;
    NEW.voucher_place_id := OLD.voucher_place_id;
    NEW.voucher_discount := OLD.voucher_discount;
    NEW.voucher_hours_only := OLD.voucher_hours_only;
    NEW.voucher_expires_at := OLD.voucher_expires_at;
    NEW.voucher_used_at := OLD.voucher_used_at;
    IF OLD.first_check_in_at IS NOT NULL THEN
      NEW.first_check_in_at := OLD.first_check_in_at;
    END IF;
  END IF;

  IF OLD.role = 'voucher' AND NEW.role = 'user' THEN
    NEW.trial_from_first_access := true;
    NEW.first_access_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- 4. Conta cupom não grava check-in direto pela API — só pela RPC
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.block_voucher_direct_checkin()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND role = 'voucher'
  ) THEN
    RAISE EXCEPTION 'VOUCHER_USE_RPC';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS block_voucher_direct_checkin ON public.access_records;
CREATE TRIGGER block_voucher_direct_checkin
  BEFORE INSERT OR UPDATE ON public.access_records
  FOR EACH ROW EXECUTE FUNCTION public.block_voucher_direct_checkin();

-- ---------------------------------------------
-- 5. Usar o cupom: valida, grava o check-in (24h) e marca o cupom como usado.
-- p_label: desconto vigente no restaurante — só é usado quando o cupom é do
-- desconto padrão (voucher_discount NULL); o front calcula as janelas.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.use_voucher(p_label TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  prof public.profiles%ROWTYPE;
  pl public.places%ROWTYPE;
  now_ms BIGINT := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  label TEXT;
  disc JSONB;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR prof.role <> 'voucher' OR prof.voucher_place_id IS NULL THEN
    RAISE EXCEPTION 'VOUCHER_NOT_FOUND';
  END IF;
  IF prof.voucher_used_at IS NOT NULL THEN
    RAISE EXCEPTION 'VOUCHER_ALREADY_USED';
  END IF;
  IF prof.voucher_expires_at IS NOT NULL AND prof.voucher_expires_at < now_ms THEN
    RAISE EXCEPTION 'VOUCHER_EXPIRED';
  END IF;

  SELECT * INTO pl FROM public.places WHERE id = prof.voucher_place_id;
  IF NOT FOUND OR NOT (pl.is_active OR (pl.reactivate_at IS NOT NULL AND pl.reactivate_at <= NOW())) THEN
    RAISE EXCEPTION 'VOUCHER_PLACE_UNAVAILABLE';
  END IF;

  label := COALESCE(NULLIF(trim(prof.voucher_discount), ''), NULLIF(trim(p_label), ''));
  IF label IS NULL THEN
    RAISE EXCEPTION 'VOUCHER_NO_DISCOUNT_NOW';
  END IF;
  disc := jsonb_build_object('source', 'voucher', 'label', left(label, 80));
  IF NULLIF(trim(p_description), '') IS NOT NULL THEN
    disc := disc || jsonb_build_object('description', left(p_description, 300));
  END IF;

  INSERT INTO public.access_records (user_id, place_id, "timestamp", expires_at, discount)
  VALUES (prof.id, pl.id, now_ms, now_ms + 86400000, disc)
  ON CONFLICT (user_id, place_id) DO UPDATE
    SET "timestamp" = EXCLUDED."timestamp", expires_at = EXCLUDED.expires_at, discount = EXCLUDED.discount;

  UPDATE public.profiles
     SET voucher_used_at = now_ms,
         first_check_in_at = COALESCE(first_check_in_at, now_ms)
   WHERE id = prof.id;

  UPDATE public.places SET check_in_count = COALESCE(check_in_count, 0) + 1 WHERE id = pl.id;

  RETURN jsonb_build_object('placeId', pl.id, 'timestamp', now_ms, 'expiresAt', now_ms + 86400000, 'discount', disc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.use_voucher(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_voucher(TEXT, TEXT) TO authenticated;
