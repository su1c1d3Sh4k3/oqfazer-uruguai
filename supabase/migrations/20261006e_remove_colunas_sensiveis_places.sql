-- =============================================
-- 2026-10-06 (e) — limpeza opcional — Executar SOMENTE após o deploy do frontend que usa `place_private`
-- (a versão antiga envia essas colunas ao salvar). Enquanto isso, 20261006c garante que fiquem vazias.
-- Os dados já foram copiados para public.place_private em 20261006b.
-- =============================================
ALTER TABLE public.places
  DROP COLUMN IF EXISTS responsible_name,
  DROP COLUMN IF EXISTS ci,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS contact_phone;
