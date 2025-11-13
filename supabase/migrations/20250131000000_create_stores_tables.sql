-- =====================================================
-- Migration: Create Stores Tables and Migrate Data
-- Date: 20250131
-- =====================================================

-- =====================================================
-- PART 1: BACKUP AND RENAME LEGACY TABLE
-- =====================================================

-- Rename existing user_settings to user_settings_deprecated for backward compatibility
-- This preserves old data while allowing us to create new structure
ALTER TABLE user_settings RENAME TO user_settings_deprecated;

-- =====================================================
-- PART 2: CREATE NEW stores TABLE
-- =====================================================

-- Stores table to hold store configuration (replaces user_settings)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Store information
  logo TEXT, -- base64 encoded image
  address TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  store_description TEXT,
  tagline TEXT,
  store_number TEXT,
  payment_method TEXT,
  brand_color TEXT NOT NULL DEFAULT '#10b981',
  invoice_prefix TEXT,
  store_code TEXT,

  -- Invoice numbering configuration
  invoice_number_format TEXT,
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  invoice_number_padding INTEGER NOT NULL DEFAULT 3,
  reset_counter_daily BOOLEAN NOT NULL DEFAULT false,
  daily_invoice_date DATE,
  daily_invoice_counter INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one active store per user (optional constraint)
  UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_active ON stores(user_id, is_active);
CREATE INDEX idx_stores_slug ON stores(slug);

-- Trigger to update updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 3: CREATE store_contacts TABLE
-- =====================================================

-- Store contacts to hold store owner/administrator information
CREATE TABLE store_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  signature TEXT, -- base64 encoded signature image
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_store_contacts_store_id ON store_contacts(store_id);
CREATE INDEX idx_store_contacts_primary ON store_contacts(store_id, is_primary);

-- Trigger to update updated_at
CREATE TRIGGER update_store_contacts_updated_at
  BEFORE UPDATE ON store_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 4: CREATE user_preferences TABLE
-- =====================================================

-- User preferences for application settings
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_language TEXT DEFAULT 'id',
  timezone TEXT DEFAULT 'Asia/Jakarta',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  currency TEXT DEFAULT 'IDR',
  default_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_default_store ON user_preferences(default_store_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 5: DATA MIGRATION
-- =====================================================

-- Function to safely convert empty strings to null
CREATE OR REPLACE FUNCTION migrate_empty_to_null(text)
RETURNS text AS $$
BEGIN
  RETURN CASE WHEN trim($1) = '' THEN NULL ELSE $1 END;
END;
$$ LANGUAGE plpgsql;

-- Migrate data from user_settings_deprecated to stores
-- This preserves all existing data while adapting to new structure
INSERT INTO stores (
  id,
  user_id,
  name,
  slug,
  is_active,
  logo,
  address,
  whatsapp,
  phone,
  email,
  website,
  store_description,
  tagline,
  store_number,
  payment_method,
  brand_color,
  invoice_prefix,
  store_code,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(), -- Generate new UUID for stores
  user_id,
  name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || SUBSTRING(user_id::text, 1, 8) as slug,
  true as is_active,
  logo,
  address,
  whatsapp,
  migrate_empty_to_null(phone),
  migrate_empty_to_null(email),
  NULL as website, -- Field didn't exist in user_settings
  migrate_empty_to_null(store_description),
  migrate_empty_to_null(tagline),
  migrate_empty_to_null(store_number),
  migrate_empty_to_null(payment_method),
  COALESCE(brand_color, '#10b981') as brand_color,
  'INV' as invoice_prefix, -- Default value
  UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g'), 1, 6)) as store_code,
  created_at,
  updated_at
FROM user_settings_deprecated
ON CONFLICT DO NOTHING; -- Skip if already migrated

-- Migrate data from user_settings_deprecated to store_contacts
-- Create primary contact from admin_name and admin_title
INSERT INTO store_contacts (
  id,
  store_id,
  name,
  title,
  signature,
  is_primary,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.id,
  usd.admin_name,
  migrate_empty_to_null(usd.admin_title),
  usd.signature,
  true,
  usd.created_at,
  usd.updated_at
FROM user_settings_deprecated usd
INNER JOIN stores s ON s.user_id = usd.user_id
ON CONFLICT DO NOTHING; -- Skip if already migrated

-- Migrate data from user_settings_deprecated to user_preferences
-- Set default store to the migrated store
INSERT INTO user_preferences (
  id,
  user_id,
  preferred_language,
  timezone,
  date_format,
  currency,
  default_store_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  user_id,
  'id' as preferred_language,
  'Asia/Jakarta' as timezone,
  'DD/MM/YYYY' as date_format,
  'IDR' as currency,
  s.id as default_store_id,
  created_at,
  updated_at
FROM user_settings_deprecated usd
INNER JOIN stores s ON s.user_id = usd.user_id
ON CONFLICT (user_id) DO NOTHING; -- Skip if already migrated

-- =====================================================
-- PART 6: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: stores
CREATE POLICY "Users can view own stores"
  ON stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies: store_contacts
CREATE POLICY "Users can view own store contacts"
  ON store_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_contacts.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own store contacts"
  ON store_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_contacts.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own store contacts"
  ON store_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_contacts.store_id
      AND stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_contacts.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own store contacts"
  ON store_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_contacts.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- RLS Policies: user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PART 7: CLEANUP AND COMMENTS
-- =====================================================

-- Add comments for documentation
COMMENT ON TABLE stores IS 'Stores configuration data for each user';
COMMENT ON TABLE store_contacts IS 'Store owner/administrator contact information';
COMMENT ON TABLE user_preferences IS 'User application preferences and settings';
COMMENT ON TABLE user_settings_deprecated IS 'Legacy table - use stores instead';

COMMENT ON COLUMN stores.logo IS 'Base64 encoded image data for store logo';
COMMENT ON COLUMN stores.brand_color IS 'Hex color code for brand theming';
COMMENT ON COLUMN stores.invoice_prefix IS 'Prefix for invoice numbers (e.g., INV, BIL)';
COMMENT ON COLUMN stores.store_code IS 'Short code for invoice numbering (2-6 chars)';
COMMENT ON COLUMN stores.invoice_number_format IS 'Template for invoice number formatting';
COMMENT ON COLUMN stores.next_invoice_number IS 'Next invoice number to use';
COMMENT ON COLUMN stores.reset_counter_daily IS 'Whether to reset invoice counter daily';

COMMENT ON COLUMN store_contacts.signature IS 'Base64 encoded signature image';
COMMENT ON COLUMN store_contacts.is_primary IS 'Whether this is the primary contact';

COMMENT ON COLUMN user_preferences.default_store_id IS 'Reference to default store for this user';
COMMENT ON COLUMN user_preferences.currency IS 'Preferred currency for invoices';

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Uncomment these to verify migration:
-- SELECT COUNT(*) as migrated_stores FROM stores;
-- SELECT COUNT(*) as migrated_contacts FROM store_contacts;
-- SELECT COUNT(*) as migrated_preferences FROM user_preferences;

-- Show sample of migrated data:
-- SELECT s.name, s.brand_color, sc.name as contact_name, s.created_at
-- FROM stores s
-- LEFT JOIN store_contacts sc ON s.id = sc.store_id
-- LIMIT 5;
