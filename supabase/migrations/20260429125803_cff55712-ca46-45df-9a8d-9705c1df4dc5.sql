
-- Roles enum + table (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles insert by owner" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update by owner" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products (public catalog)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  specs JSONB NOT NULL DEFAULT '{}',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  connectivity TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cart
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cart owner all" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wishlist owner all" ON public.wishlist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Home',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Address owner all" ON public.addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  address JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Placed',
  tracking_steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders owner select" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Orders owner insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews owner insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Reviews owner update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Reviews owner delete" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Coupons
CREATE TABLE public.coupons (
  code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons public read active" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.coupons (code, discount_type, discount_value, min_order) VALUES
  ('SOUND10', 'percent', 10, 1000),
  ('FIRST20', 'percent', 20, 2000),
  ('BASS50', 'flat', 500, 3000);

-- Seed 20 products
INSERT INTO public.products (name, brand, category, description, price, mrp, images, specs, rating, review_count, stock, connectivity, features, is_featured) VALUES
('WH-1000XM5 Wireless Noise Cancelling', 'Sony', 'Over-Ear', 'Industry-leading noise cancellation with crystal-clear hands-free calling. 30-hour battery life.', 27990, 34990, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800','https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'], '{"driver":"30mm","frequency":"4Hz-40kHz","impedance":"48 ohm","battery":"30 hours","weight":"250g"}', 4.7, 1284, 25, 'Wireless', ARRAY['Noise Cancelling','Foldable','Mic included','Bluetooth 5.0+'], true),
('QuietComfort Ultra Headphones', 'Bose', 'Over-Ear', 'Immersive audio with world-class noise cancellation. Spatial audio support.', 41990, 49900, ARRAY['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800','https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=800'], '{"driver":"35mm","frequency":"10Hz-22kHz","impedance":"32 ohm","battery":"24 hours","weight":"253g"}', 4.8, 892, 18, 'Wireless', ARRAY['Noise Cancelling','Mic included','Bluetooth 5.0+','Foldable'], true),
('AirPods Pro (2nd Gen)', 'Apple', 'TWS', 'Adaptive Audio, Personalized Spatial Audio, and USB-C charging case.', 21990, 26900, ARRAY['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800','https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800'], '{"driver":"11mm","frequency":"20Hz-20kHz","battery":"6h + 30h case","weight":"5.3g each"}', 4.9, 5421, 50, 'Wireless', ARRAY['Noise Cancelling','Waterproof','Mic included','Bluetooth 5.0+'], true),
('JBL Tune 760NC', 'JBL', 'Over-Ear', 'Active noise cancelling with JBL Pure Bass sound. 35-hour battery.', 5999, 9999, ARRAY['https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800','https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=800'], '{"driver":"40mm","frequency":"20Hz-20kHz","impedance":"32 ohm","battery":"35 hours","weight":"220g"}', 4.4, 2103, 40, 'Wireless', ARRAY['Noise Cancelling','Foldable','Mic included','Bluetooth 5.0+'], true),
('Sennheiser Momentum 4', 'Sennheiser', 'Over-Ear', 'Audiophile-grade sound, adaptive noise cancellation, 60-hour battery.', 29990, 39990, ARRAY['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800','https://images.unsplash.com/photo-1545127398-14699f92334b?w=800'], '{"driver":"42mm","frequency":"6Hz-22kHz","impedance":"470 ohm","battery":"60 hours","weight":"293g"}', 4.6, 763, 15, 'Wireless', ARRAY['Noise Cancelling','Mic included','Bluetooth 5.0+'], true),
('Boat Rockerz 450', 'Boat', 'Over-Ear', 'Powerful 40mm drivers with up to 15 hours of immersive audio.', 1499, 3990, ARRAY['https://images.unsplash.com/photo-1599669454699-248893623440?w=800','https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'], '{"driver":"40mm","frequency":"20Hz-20kHz","impedance":"32 ohm","battery":"15 hours","weight":"180g"}', 4.2, 8923, 120, 'Wireless', ARRAY['Foldable','Mic included','Bluetooth 5.0+'], true),
('Sony WF-1000XM5', 'Sony', 'TWS', 'Best-in-class noise cancellation in true wireless form. 8h battery.', 19990, 24990, ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800','https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'], '{"driver":"8.4mm","frequency":"20Hz-20kHz","battery":"8h + 24h case","weight":"5.9g each"}', 4.7, 1456, 30, 'Wireless', ARRAY['Noise Cancelling','Waterproof','Mic included','Bluetooth 5.0+'], true),
('Skullcandy Crusher Evo', 'Skullcandy', 'Over-Ear', 'Sensory bass with adjustable haptic intensity. 40-hour battery.', 8999, 14999, ARRAY['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800','https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'], '{"driver":"40mm","frequency":"20Hz-20kHz","impedance":"32 ohm","battery":"40 hours","weight":"312g"}', 4.3, 612, 22, 'Wireless', ARRAY['Foldable','Mic included','Bluetooth 5.0+'], true),
('AirPods Max', 'Apple', 'Over-Ear', 'High-fidelity audio with computational audio. Premium aluminum design.', 54900, 59900, ARRAY['https://images.unsplash.com/photo-1625245488585-19b00ed1b6f2?w=800','https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'], '{"driver":"40mm","frequency":"20Hz-20kHz","battery":"20 hours","weight":"384g"}', 4.5, 421, 8, 'Wireless', ARRAY['Noise Cancelling','Mic included','Bluetooth 5.0+'], false),
('Bose QuietComfort Earbuds II', 'Bose', 'TWS', 'CustomTune technology delivers personalized sound and noise cancellation.', 24990, 29900, ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800','https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800'], '{"driver":"9.3mm","frequency":"20Hz-20kHz","battery":"6h + 24h case","weight":"6.24g each"}', 4.6, 987, 20, 'Wireless', ARRAY['Noise Cancelling','Waterproof','Mic included','Bluetooth 5.0+'], false),
('JBL Quantum 800 Gaming', 'JBL', 'Gaming', 'Wireless gaming headset with active noise cancelling and RGB.', 14999, 19999, ARRAY['https://images.unsplash.com/photo-1612444530582-fc66183b16f8?w=800','https://images.unsplash.com/photo-1591105575633-922e09c45e8e?w=800'], '{"driver":"50mm","frequency":"20Hz-40kHz","impedance":"32 ohm","battery":"14 hours","weight":"410g"}', 4.4, 543, 18, 'Wireless', ARRAY['Noise Cancelling','Mic included','Bluetooth 5.0+'], false),
('Sennheiser HD 660S2', 'Sennheiser', 'Over-Ear', 'Audiophile open-back reference headphones for studio use.', 39990, 44990, ARRAY['https://images.unsplash.com/photo-1545127398-14699f92334b?w=800','https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'], '{"driver":"38mm","frequency":"8Hz-41.5kHz","impedance":"300 ohm","weight":"260g"}', 4.8, 234, 6, 'Wired', ARRAY['Mic included'], false),
('Boat Airdopes 141', 'Boat', 'TWS', 'Up to 42 hours playback with ENx technology for clear calls.', 1299, 2990, ARRAY['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800','https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'], '{"driver":"8mm","frequency":"20Hz-20kHz","battery":"8h + 34h case","weight":"4g each"}', 4.1, 12453, 200, 'Wireless', ARRAY['Waterproof','Mic included','Bluetooth 5.0+'], true),
('Sony MDR-7506 Studio', 'Sony', 'Studio', 'Professional studio monitor headphones with closed-back design.', 9990, 12990, ARRAY['https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800','https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'], '{"driver":"40mm","frequency":"10Hz-20kHz","impedance":"63 ohm","weight":"230g"}', 4.7, 876, 14, 'Wired', ARRAY['Foldable','Mic included'], false),
('JBL Endurance Sprint', 'JBL', 'Sports', 'Sweatproof in-ear sports headphones with magnetic earbuds.', 1999, 3999, ARRAY['https://images.unsplash.com/photo-1599669454699-248893623440?w=800','https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'], '{"driver":"8.5mm","frequency":"20Hz-20kHz","battery":"8 hours","weight":"16g"}', 4.2, 1432, 60, 'Wireless', ARRAY['Waterproof','Mic included','Bluetooth 5.0+'], false),
('Skullcandy Push Active', 'Skullcandy', 'Sports', 'Active true wireless with secure-fit ear hooks. IP55 rated.', 4999, 7999, ARRAY['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800','https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'], '{"driver":"6mm","frequency":"20Hz-20kHz","battery":"10h + 34h case","weight":"7g each"}', 4.3, 432, 28, 'Wireless', ARRAY['Waterproof','Mic included','Bluetooth 5.0+'], false),
('Bose SoundLink On-Ear', 'Bose', 'Over-Ear', 'Lightweight on-ear with 15 hours of wireless playback.', 17990, 22900, ARRAY['https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=800','https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'], '{"driver":"32mm","frequency":"20Hz-20kHz","impedance":"32 ohm","battery":"15 hours","weight":"195g"}', 4.4, 321, 12, 'Wireless', ARRAY['Foldable','Mic included','Bluetooth 5.0+'], false),
('Apple AirPods (3rd Gen)', 'Apple', 'TWS', 'Spatial audio with dynamic head tracking. Sweat and water resistant.', 18900, 21900, ARRAY['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800','https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'], '{"driver":"11mm","frequency":"20Hz-20kHz","battery":"6h + 30h case","weight":"4.28g each"}', 4.6, 2341, 45, 'Wireless', ARRAY['Waterproof','Mic included','Bluetooth 5.0+'], false),
('Boat Immortal IM-1000D Gaming', 'Boat', 'Gaming', 'Dual EQ modes, 50mm drivers, RGB lighting for immersive gaming.', 2999, 5990, ARRAY['https://images.unsplash.com/photo-1612444530582-fc66183b16f8?w=800','https://images.unsplash.com/photo-1591105575633-922e09c45e8e?w=800'], '{"driver":"50mm","frequency":"20Hz-20kHz","impedance":"32 ohm","weight":"320g"}', 4.0, 876, 35, 'Wired', ARRAY['Mic included'], false),
('Sennheiser CX True Wireless', 'Sennheiser', 'TWS', 'Customizable touch controls with passive noise isolation.', 6990, 9990, ARRAY['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800','https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'], '{"driver":"7mm","frequency":"5Hz-21kHz","battery":"9h + 18h case","weight":"6g each"}', 4.3, 567, 26, 'Wireless', ARRAY['Waterproof','Mic included','Bluetooth 5.0+'], false);
