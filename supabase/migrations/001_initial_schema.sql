-- Love Happy Hours — Initial Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cities
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  currency TEXT NOT NULL DEFAULT 'THB',
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  emoji TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Neighborhoods
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius_km DECIMAL(5, 2) DEFAULT 2.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city_id, slug)
);

-- Venues
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('bar','restaurant','cafe','spa','salon','barber','massage','gym','entertainment','hotel','bakery','bubble_tea')),
  subcategories TEXT[] DEFAULT '{}',
  city_id UUID NOT NULL REFERENCES cities(id),
  neighborhood_id UUID REFERENCES neighborhoods(id),
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  google_place_id TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  line_id TEXT,
  photos TEXT[] DEFAULT '{}',
  logo TEXT,
  cover_image TEXT,
  price_range INTEGER NOT NULL DEFAULT 2 CHECK (price_range BETWEEN 1 AND 4),
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  opening_hours JSONB DEFAULT '{}',
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-set location geography from lat/lng
CREATE OR REPLACE FUNCTION set_venue_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON venues
  FOR EACH ROW EXECUTE FUNCTION set_venue_location();

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('happy_hour','daily_deal','ladies_night','early_bird','late_night','weekend_special')),
  category_tags TEXT[] DEFAULT '{}',
  days_active TEXT[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  valid_from DATE,
  valid_until DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  original_price DECIMAL(10, 2),
  deal_price DECIMAL(10, 2),
  discount_percent INTEGER,
  deal_terms TEXT,
  image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  redemption_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  avatar TEXT,
  preferred_city_id UUID REFERENCES cities(id),
  preferred_language TEXT DEFAULT 'en',
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Business Users
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','premium','enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  photos TEXT[] DEFAULT '{}',
  is_verified_visit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, venue_id)
);

-- Indexes
CREATE INDEX idx_venues_city ON venues(city_id);
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_deals_venue ON deals(venue_id);
CREATE INDEX idx_deals_active ON deals(is_active, deal_type);
CREATE INDEX idx_deals_days ON deals USING GIN(days_active);
CREATE INDEX idx_reviews_venue ON reviews(venue_id);
CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id);

-- Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Public read for venues and deals
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
