-- =====================================================
-- Add Buyback Support to invoice_items
-- Migration: 20251231000001
-- =====================================================

-- Make regular invoice fields nullable (not needed for buyback items)
ALTER TABLE invoice_items
ALTER COLUMN quantity DROP NOT NULL,
ALTER COLUMN price DROP NOT NULL,
ALTER COLUMN subtotal DROP NOT NULL;

-- Add buyback fields
ALTER TABLE invoice_items
ADD COLUMN is_buyback BOOLEAN DEFAULT FALSE,
ADD COLUMN gram DECIMAL(15, 2),
ADD COLUMN buyback_rate DECIMAL(15, 2),
ADD COLUMN total DECIMAL(15, 2);

-- Add check constraint: either regular or buyback fields must be set
ALTER TABLE invoice_items
ADD CONSTRAINT check_item_type CHECK (
  (is_buyback = FALSE AND quantity IS NOT NULL AND price IS NOT NULL AND subtotal IS NOT NULL)
  OR
  (is_buyback = TRUE AND gram IS NOT NULL AND buyback_rate IS NOT NULL AND total IS NOT NULL)
);

-- Add comments for documentation
COMMENT ON COLUMN invoice_items.is_buyback IS 'True if this is a buyback item (calculated by gram × rate)';
COMMENT ON COLUMN invoice_items.gram IS 'Weight in grams for buyback items';
COMMENT ON COLUMN invoice_items.buyback_rate IS 'Price per gram for buyback items (stored in IDR)';
COMMENT ON COLUMN invoice_items.total IS 'Total amount for buyback items (gram × buyback_rate)';
