-- =====================================================
-- MANUAL MIGRATION SCRIPT FOR SUPABASE CLOUD
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================
-- Purpose: Update payment_transactions table for redirect flow
-- Date: 2025-02-20
-- =====================================================

-- Step 1: Add mayar_transaction_id column
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS mayar_transaction_id TEXT;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mayar_transaction_id 
ON payment_transactions(mayar_transaction_id);

-- Step 3: Rename webhook_verified_at to verified_at
ALTER TABLE payment_transactions 
RENAME COLUMN webhook_verified_at TO verified_at;

-- Step 4: Update column comments
COMMENT ON COLUMN payment_transactions.verified_at IS 
'Timestamp when payment was verified via Mayar API after redirect';

COMMENT ON COLUMN payment_transactions.mayar_transaction_id IS 
'Unique transaction ID from Mayar (different from invoice/payment link ID)';

COMMENT ON TABLE payment_transactions IS 
'Stores payment transaction history with Mayar using redirect-based verification';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND column_name IN ('mayar_transaction_id', 'verified_at')
ORDER BY column_name;

-- Verify index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'payment_transactions' 
AND indexname = 'idx_payment_transactions_mayar_transaction_id';

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions'
ORDER BY ordinal_position;
