-- =====================================================
-- Update Gram Precision to Support 3 Decimals
-- Migration: 20260111000000
-- Description: Changes gram column from DECIMAL(15,2) to DECIMAL(15,3)
--              to support precision like 0.005 gram
-- =====================================================

-- Update gram column precision to 3 decimal places
ALTER TABLE invoice_items
ALTER COLUMN gram TYPE DECIMAL(15, 3);

-- Update buyback_price_per_gram in user_preferences for consistency
ALTER TABLE user_preferences
ALTER COLUMN buyback_price_per_gram TYPE DECIMAL(15, 3);

-- Update comments
COMMENT ON COLUMN invoice_items.gram IS 'Weight in grams for buyback items (supports up to 3 decimal places, e.g., 0.005g)';
COMMENT ON COLUMN user_preferences.buyback_price_per_gram IS 'Default buyback price per gram (supports up to 3 decimal places)';
