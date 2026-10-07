-- =============================================
-- 2026-10-07 — Ordem definida pelo admin para cidades e categorias
-- (usada nos filtros e nos selects). Começa em ordem alfabética. Idempotente.
-- =============================================
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS sort_order INTEGER;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;

UPDATE public.cities c SET sort_order = o.rn
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 AS rn FROM public.cities) o
WHERE c.id = o.id AND c.sort_order IS NULL;

UPDATE public.categories c SET sort_order = o.rn
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 AS rn FROM public.categories) o
WHERE c.id = o.id AND c.sort_order IS NULL;
