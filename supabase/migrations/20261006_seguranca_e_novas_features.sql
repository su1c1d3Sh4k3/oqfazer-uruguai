-- =============================================
-- 2026-10-06 — Segurança + novas features
-- (intervalos de horário, descontos por horário, agência,
--  faixa de preço, filtros por país, ativar/desativar)
-- Idempotente: pode ser executado mais de uma vez.
-- =============================================

-- ---------------------------------------------
-- 0. SEGURANÇA — profiles
-- Usuário comum não pode alterar role, managed_place_id, first_login_at,
-- nem redefinir first_check_in_at depois de definido (trial infinito).
-- current_user = 'authenticated'/'anon' identifica requisições vindas da API;
-- funções SECURITY DEFINER e service_role passam direto.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.is_admin() THEN
    NEW.id := OLD.id;
    NEW.role := OLD.role;
    NEW.managed_place_id := OLD.managed_place_id;
    NEW.first_login_at := OLD.first_login_at;
    IF OLD.first_check_in_at IS NOT NULL THEN
      NEW.first_check_in_at := OLD.first_check_in_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Novo tipo de usuário: agência (vê apenas passeios)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'establishment', 'admin', 'agency'));

-- ---------------------------------------------
-- 1. Novas colunas
-- ---------------------------------------------
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS reactivate_at TIMESTAMPTZ;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS price_level SMALLINT;
ALTER TABLE public.places DROP CONSTRAINT IF EXISTS places_price_level_check;
ALTER TABLE public.places ADD CONSTRAINT places_price_level_check
  CHECK (price_level IS NULL OR price_level BETWEEN 1 AND 3);
-- [{ id, startTime: 'HH:MM', endTime: 'HH:MM', label: '10% OFF', description? }]
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS discount_rules JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Uruguai';

-- Desconto concedido no momento do check-in (snapshot)
ALTER TABLE public.access_records ADD COLUMN IF NOT EXISTS discount JSONB;

-- ---------------------------------------------
-- 2. SEGURANÇA — places
-- Métricas só mudam via increment_place_metric (SECURITY DEFINER).
-- Empresa não altera campos administrativos.
-- Não é permitido desativar lugar com check-in ativo.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_place_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.access_count := OLD.access_count;
    NEW.coupon_click_count := OLD.coupon_click_count;
    NEW.check_in_count := OLD.check_in_count;
    NEW.highlight_click_count := OLD.highlight_click_count;
    NEW.created_at := OLD.created_at;

    IF NOT public.is_admin() THEN
      NEW.id := OLD.id;
      NEW.type := OLD.type;
      NEW.featured := OLD.featured;
      NEW.featured_order := OLD.featured_order;
      NEW.display_order := OLD.display_order;
      NEW.is_active := OLD.is_active;
      NEW.reactivate_at := OLD.reactivate_at;
      NEW.price_level := OLD.price_level;
    END IF;
  END IF;

  -- Desativando (ou redesativando após a reativação automática vencer)
  IF NOT NEW.is_active
     AND (OLD.is_active OR OLD.reactivate_at IS DISTINCT FROM NEW.reactivate_at)
     AND EXISTS (
    SELECT 1 FROM public.access_records
    WHERE place_id = NEW.id
      AND expires_at > (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
  ) THEN
    RAISE EXCEPTION 'PLACE_HAS_ACTIVE_CHECKINS';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_place_fields ON public.places;
CREATE TRIGGER protect_place_fields
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.protect_place_fields();

-- Lugares inativos só aparecem para admin e para a empresa dona.
-- Desativação temporária: reactivate_at no passado = volta a aparecer.
DROP POLICY IF EXISTS "Anyone can read places" ON public.places;
DROP POLICY IF EXISTS "Read active places" ON public.places;
CREATE POLICY "Read active places"
  ON public.places FOR SELECT USING (
    is_active
    OR (reactivate_at IS NOT NULL AND reactivate_at <= NOW())
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.managed_place_id = places.id
    )
  );
