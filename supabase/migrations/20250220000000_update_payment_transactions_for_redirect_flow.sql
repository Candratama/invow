-- =====================================================
-- Migration: Update payment_transactions for redirect flow
-- Date: 20250220
-- Purpose: Add transaction ID column and rename webhook column
--          to support redirect-based payment verification
-- =====================================================

-- =====================================================
-- PART 1: ADD mayar_transaction_id COLUMN
-- =====================================================

-- Add mayar_transaction_id column to store the transaction ID from Mayar
-- This is different from mayar_invoice_id (which is the payment link ID)
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS mayar_transaction_id TEXT;

-- =====================================================
-- PART 2: ADD INDEX FOR PERFORMANCE
-- =====================================================

-- Add index on mayar_transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mayar_transaction_id 
ON payment_transactions(mayar_transaction_id);

-- =====================================================
-- PART 3: RENAME webhook_verified_at TO verified_at
-- =====================================================

-- Rename webhook_verified_at to verified_at (more generic name)
-- This reflects the change from webhook-based to redirect-based verification
ALTER TABLE payment_transactions 
RENAME COLUMN webhook_verified_at TO verified_at;

-- =====================================================
-- PART 4: UPDATE COLUMN COMMENTS
-- =====================================================

-- Update comment to reflect new verification method
COMMENT ON COLUMN payment_transactions.verified_at IS 
'Timestamp when payment was verified via Mayar API after redirect';

COMMENT ON COLUMN payment_transactions.mayar_transaction_id IS 
'Unique transaction ID from Mayar (different from invoice/payment link ID)';

-- Update table comment
COMMENT ON TABLE payment_transactions IS 
'Stores payment transaction history with Mayar using redirect-based verification';

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Uncomment these to verify migration:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'payment_transactions' 
-- AND column_name IN ('mayar_transaction_id', 'verified_at')
-- ORDER BY column_name;

-- Verify indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'payment_transactions' 
-- AND indexname LIKE '%mayar_transaction_id%';
