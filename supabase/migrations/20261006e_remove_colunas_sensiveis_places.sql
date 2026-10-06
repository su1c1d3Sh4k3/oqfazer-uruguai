-- =============================================
-- 2026-10-06 (e) — Remove as colunas sensíveis antigas de `places`.
-- Rodada após o deploy do frontend que usa `place_private` (2026-10-06).
-- Os dados já estão em public.place_private (20261006b/c).
-- Os triggers de 20261006c referenciam essas colunas: precisam sair antes,
-- senão todo UPDATE/INSERT em places falharia.
-- =============================================
DROP TRIGGER IF EXISTS move_place_private_fields ON public.places;
DROP TRIGGER IF EXISTS move_place_private_fields_insert ON public.places;
DROP FUNCTION IF EXISTS public.move_place_private_fields();
DROP FUNCTION IF EXISTS public.move_place_private_fields_after_insert();

ALTER TABLE public.places
  DROP COLUMN IF EXISTS responsible_name,
  DROP COLUMN IF EXISTS ci,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS contact_phone;
