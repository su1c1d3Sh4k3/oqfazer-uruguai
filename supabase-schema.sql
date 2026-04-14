-- =============================================
-- URUGUAI DESCONTOS - Supabase Schema
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'establishment', 'admin')),
  managed_place_id TEXT,
  name TEXT,
  cpf TEXT,
  phone TEXT,
  travel_period TEXT,
  ci TEXT,
  responsible_name TEXT,
  deletion_requested BOOLEAN DEFAULT FALSE,
  first_check_in_at BIGINT,
  first_login_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PLACES
CREATE TABLE public.places (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('restaurant', 'tour')),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  discount_badge TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  gallery_images JSONB NOT NULL DEFAULT '[]',
  logo_image TEXT,
  description TEXT NOT NULL DEFAULT '',
  discount_description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  coordinates JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}',
  featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER,
  display_order INTEGER,
  operating_hours JSONB DEFAULT '[]',
  duration TEXT,
  departure_city TEXT,
  included JSONB DEFAULT '[]',
  available_days JSONB DEFAULT '[]',
  booking_url TEXT,
  coupon_code TEXT,
  instagram_url TEXT,
  website_url TEXT,
  access_count INTEGER DEFAULT 0,
  coupon_click_count INTEGER DEFAULT 0,
  check_in_count INTEGER DEFAULT 0,
  highlight_click_count INTEGER DEFAULT 0,
  flash_offer JSONB,
  responsible_name TEXT,
  ci TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_places_type ON public.places(type);
CREATE INDEX idx_places_city ON public.places(city);
CREATE INDEX idx_places_category ON public.places(category);
CREATE INDEX idx_places_featured ON public.places(featured);

-- 3. ACCESS RECORDS (check-ins)
CREATE TABLE public.access_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_access_user_place ON public.access_records(user_id, place_id);
CREATE INDEX idx_access_user ON public.access_records(user_id);

-- 4. FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_favorites_unique ON public.favorites(user_id, place_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- 5. REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  date BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_reviews_user_place ON public.reviews(user_id, place_id);
CREATE INDEX idx_reviews_place ON public.reviews(place_id);

-- 6. LOOKUP TABLES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL USING (public.is_admin());

-- PLACES (publicly readable)
CREATE POLICY "Anyone can read places"
  ON public.places FOR SELECT USING (true);
CREATE POLICY "Admin can manage places"
  ON public.places FOR ALL USING (public.is_admin());
CREATE POLICY "Establishment can update own place"
  ON public.places FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'establishment'
        AND profiles.managed_place_id = places.id
    )
  );

-- ACCESS RECORDS
CREATE POLICY "Users manage own access records"
  ON public.access_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all access records"
  ON public.access_records FOR SELECT USING (public.is_admin());

-- FAVORITES
CREATE POLICY "Users manage own favorites"
  ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- REVIEWS
CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage reviews"
  ON public.reviews FOR ALL USING (public.is_admin());

-- CATEGORIES / CITIES / BADGES (publicly readable, admin-writable)
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin manages categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admin manages cities" ON public.cities FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admin manages badges" ON public.badges FOR ALL USING (public.is_admin());

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Increment place metrics safely (any authenticated user)
CREATE OR REPLACE FUNCTION public.increment_place_metric(
  p_place_id TEXT,
  p_metric TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_metric = 'access_count' THEN
    UPDATE public.places SET access_count = access_count + 1, updated_at = NOW() WHERE id = p_place_id;
  ELSIF p_metric = 'coupon_click_count' THEN
    UPDATE public.places SET coupon_click_count = coupon_click_count + 1, updated_at = NOW() WHERE id = p_place_id;
  ELSIF p_metric = 'check_in_count' THEN
    UPDATE public.places SET check_in_count = check_in_count + 1, updated_at = NOW() WHERE id = p_place_id;
  ELSIF p_metric = 'highlight_click_count' THEN
    UPDATE public.places SET highlight_click_count = highlight_click_count + 1, updated_at = NOW() WHERE id = p_place_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to all authenticated users and anon (for view counting)
GRANT EXECUTE ON FUNCTION public.increment_place_metric(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_place_metric(TEXT, TEXT) TO anon;

-- =============================================
-- SEED DATA
-- =============================================

-- Categories
INSERT INTO public.categories (name) VALUES
  ('Restaurantes'), ('Passeios'), ('Cafeterias'),
  ('Bares'), ('Museus'), ('Vinícolas')
ON CONFLICT (name) DO NOTHING;

-- Cities
INSERT INTO public.cities (name) VALUES
  ('Montevideo'), ('Punta del Este'), ('Colonia del Sacramento')
ON CONFLICT (name) DO NOTHING;

-- Badges
INSERT INTO public.badges (name) VALUES
  ('2x1'), ('Desconto de 50%'), ('Desconto de 40%'),
  ('Desconto de 30%'), ('Desconto de 20%'), ('Desconto de 10%'), ('Brinde')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 9. APP SETTINGS (key-value config)
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Todos podem ler configurações
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Apenas admins podem atualizar configurações
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Valor padrão do WhatsApp de suporte
INSERT INTO public.app_settings (key, value) VALUES
  ('whatsapp_support', '5547999999999')
ON CONFLICT (key) DO NOTHING;
