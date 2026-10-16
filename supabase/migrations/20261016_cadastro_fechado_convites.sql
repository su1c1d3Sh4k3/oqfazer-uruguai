-- =============================================
-- 2026-10-16 — Cadastro fechado: convites + aprovação do admin
-- O cadastro público do Supabase Auth fica desligado; contas novas só nascem
-- pela Edge Function `accounts` (convite, solicitação aprovada pelo admin ou
-- criação direta pelo admin). Idempotente.
-- =============================================

-- ---------------------------------------------
-- 1. profiles: status da conta + primeiro acesso real
-- account_status: 'pending' = solicitou cadastro e aguarda aprovação
--   (a conta também fica banida no Auth, então nem consegue logar).
-- first_access_at: primeiro login de verdade (first_login_at é, na prática,
--   a data de criação da conta e não muda).
-- trial_from_first_access: os 20 dias contam do primeiro acesso. Só contas
--   novas — as existentes continuam contando do primeiro check-in.
-- ---------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'pending'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_access_at BIGINT;

-- Linhas existentes recebem false; a partir daqui o default passa a ser true
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_from_first_access BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ALTER COLUMN trial_from_first_access SET DEFAULT true;

-- Usuário comum também não altera os campos novos
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
    IF OLD.first_check_in_at IS NOT NULL THEN
      NEW.first_check_in_at := OLD.first_check_in_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Marca o primeiro acesso do usuário logado (só na primeira vez)
CREATE OR REPLACE FUNCTION public.register_first_access()
RETURNS BIGINT AS $$
DECLARE
  v BIGINT;
BEGIN
  UPDATE public.profiles
     SET first_access_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
   WHERE id = auth.uid() AND first_access_at IS NULL;
  SELECT first_access_at INTO v FROM public.profiles WHERE id = auth.uid();
  RETURN v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.register_first_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_first_access() TO authenticated;

-- ---------------------------------------------
-- 2. invites — convite individual: um email, um tipo de conta, uso único,
-- validade de 7 dias. Só o admin vê/cria; o aceite passa pela Edge Function.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE
    DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'establishment', 'agency')),
  managed_place_id TEXT REFERENCES public.places(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS invites_email_idx ON public.invites (lower(email));

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage invites" ON public.invites;
CREATE POLICY "Admin can manage invites" ON public.invites
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
