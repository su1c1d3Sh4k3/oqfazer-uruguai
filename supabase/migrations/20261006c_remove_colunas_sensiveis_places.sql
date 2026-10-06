-- =============================================
-- 2026-10-06 (c) — Executar SOMENTE após o deploy do frontend que usa `place_private`.
-- Os dados já foram copiados para public.place_private em 20261006b.
-- =============================================
ALTER TABLE public.places
  DROP COLUMN IF EXISTS responsible_name,
  DROP COLUMN IF EXISTS ci,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS contact_phone;
