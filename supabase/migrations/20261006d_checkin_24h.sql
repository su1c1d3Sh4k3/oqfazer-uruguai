-- =============================================
-- 2026-10-06 (d) — Check-in passa a valer 24h em todo o sistema
-- (o ticket e o diálogo já informavam 24h; o registro gravava 2h).
-- =============================================
UPDATE public.access_records
SET expires_at = "timestamp" + 86400000
WHERE expires_at = "timestamp" + 7200000;
