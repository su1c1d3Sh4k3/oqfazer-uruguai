-- =============================================
-- 2026-10-06 (c) — Colunas sensíveis antigas de `places` ficam sempre vazias.
-- Seguro com qualquer versão do frontend: se algo (ex.: versão antiga em produção)
-- gravar CI/contatos em `places`, o valor vai para place_private e a coluna pública
-- é zerada. Idempotente.
-- =============================================
CREATE OR REPLACE FUNCTION public.move_place_private_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.responsible_name IS NOT NULL OR NEW.ci IS NOT NULL
     OR NEW.contact_email IS NOT NULL OR NEW.contact_phone IS NOT NULL THEN
    INSERT INTO public.place_private (place_id, responsible_name, ci, contact_email, contact_phone, updated_at)
    VALUES (NEW.id, NEW.responsible_name, NEW.ci, NEW.contact_email, NEW.contact_phone, NOW())
    ON CONFLICT (place_id) DO UPDATE SET
      responsible_name = COALESCE(EXCLUDED.responsible_name, place_private.responsible_name),
      ci = COALESCE(EXCLUDED.ci, place_private.ci),
      contact_email = COALESCE(EXCLUDED.contact_email, place_private.contact_email),
      contact_phone = COALESCE(EXCLUDED.contact_phone, place_private.contact_phone),
      updated_at = NOW();
    NEW.responsible_name := NULL;
    NEW.ci := NULL;
    NEW.contact_email := NULL;
    NEW.contact_phone := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS move_place_private_fields ON public.places;
-- AFTER INSERT não pode alterar NEW; para INSERT o registro em place_private precisa
-- do place já existente (FK), então INSERT usa um trigger AFTER + UPDATE.
CREATE TRIGGER move_place_private_fields
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.move_place_private_fields();

CREATE OR REPLACE FUNCTION public.move_place_private_fields_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.responsible_name IS NOT NULL OR NEW.ci IS NOT NULL
     OR NEW.contact_email IS NOT NULL OR NEW.contact_phone IS NOT NULL THEN
    -- Dispara o trigger BEFORE UPDATE acima, que move e zera os campos
    UPDATE public.places SET responsible_name = responsible_name WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS move_place_private_fields_insert ON public.places;
CREATE TRIGGER move_place_private_fields_insert
  AFTER INSERT ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.move_place_private_fields_after_insert();
