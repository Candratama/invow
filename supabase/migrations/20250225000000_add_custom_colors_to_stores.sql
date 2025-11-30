-- =====================================================
-- Migration: Add Custom Color Columns to Stores Table
-- Date: 20250225
-- Purpose: Support premium feature for custom brand colors
-- Requirements: 6.3, 6.4
-- =====================================================

-- Add primary_color column with default value
ALTER TABLE stores ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#000000';

-- Add secondary_color column with default value
ALTER TABLE stores ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#666666';

-- Add accent_color column with default value
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#0066cc';

-- Add comments for documentation
COMMENT ON COLUMN stores.primary_color IS 'Primary brand color for invoices (hex format, premium feature)';
COMMENT ON COLUMN stores.secondary_color IS 'Secondary brand color for invoices (hex format, premium feature)';
COMMENT ON COLUMN stores.accent_color IS 'Accent color for invoices (hex format, premium feature)';

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Uncomment to verify migration:
-- SELECT id, name, primary_color, secondary_color, accent_color FROM stores LIMIT 5;
