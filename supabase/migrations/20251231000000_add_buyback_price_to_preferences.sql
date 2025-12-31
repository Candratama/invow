-- =====================================================
-- Add Buyback Price Per Gram to user_preferences
-- Migration: 20251231000000
-- =====================================================

-- Add buyback_price_per_gram column with default value
-- This is safe as it adds a new column with default value (0)
ALTER TABLE user_preferences
ADD COLUMN buyback_price_per_gram DECIMAL(15,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.buyback_price_per_gram IS 'Price per gram for buyback invoices, stored in IDR';

-- Verify the migration is backward compatible
-- Existing invoices remain unchanged as is_buyback defaults to false
-- New column has default value (0) so no NULL values
-- RLS policies apply to new column automatically