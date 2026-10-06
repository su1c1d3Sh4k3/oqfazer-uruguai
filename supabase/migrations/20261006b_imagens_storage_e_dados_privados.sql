-- =============================================
-- 2026-10-06 (b) — Imagens no Storage + dados sensíveis fora de `places`
-- Idempotente.
-- =============================================

-- ---------------------------------------------
-- 1. Dados sensíveis do lugar (CI, contatos) — antes legíveis por qualquer visitante
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_private (
  place_id TEXT PRIMARY KEY REFERENCES public.places(id) ON DELETE CASCADE,
  responsible_name TEXT,
  ci TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.place_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages place private data" ON public.place_private;
CREATE POLICY "Admin manages place private data"
  ON public.place_private FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Owner reads place private data" ON public.place_private;
CREATE POLICY "Owner reads place private data"
  ON public.place_private FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.managed_place_id = place_private.place_id
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'places' AND column_name = 'ci'
  ) THEN
    INSERT INTO public.place_private (place_id, responsible_name, ci, contact_email, contact_phone)
    SELECT id, responsible_name, ci, contact_email, contact_phone
    FROM public.places
    WHERE responsible_name IS NOT NULL OR ci IS NOT NULL
       OR contact_email IS NOT NULL OR contact_phone IS NOT NULL
    ON CONFLICT (place_id) DO NOTHING;

    -- Esvazia as colunas públicas. Elas são removidas em 20261006c, após o deploy
    -- do frontend novo (a versão antiga ainda as envia ao salvar).
    UPDATE public.places
    SET responsible_name = NULL, ci = NULL, contact_email = NULL, contact_phone = NULL
    WHERE responsible_name IS NOT NULL OR ci IS NOT NULL
       OR contact_email IS NOT NULL OR contact_phone IS NOT NULL;
  END IF;
END $$;

-- ---------------------------------------------
-- 2. Miniatura da capa (usada nos cards)
-- ---------------------------------------------
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS cover_thumb TEXT;

-- ---------------------------------------------
-- 3. Bucket público para imagens dos lugares
-- Caminho: <place_id>/<arquivo>
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('place-images', 'place-images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Place images public read" ON storage.objects;
CREATE POLICY "Place images public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'place-images');

-- Admin envia para qualquer lugar; empresa só para a pasta do próprio lugar
DROP POLICY IF EXISTS "Place images upload" ON storage.objects;
CREATE POLICY "Place images upload"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'place-images' AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'establishment'
          -- qualificado: dentro do EXISTS, `name` seria profiles.name
          AND profiles.managed_place_id = (storage.foldername(objects.name))[1]
      )
    )
  );

DROP POLICY IF EXISTS "Place images admin delete" ON storage.objects;
CREATE POLICY "Place images admin delete"
  ON storage.objects FOR DELETE USING (bucket_id = 'place-images' AND public.is_admin());
