-- =====================================================
-- MANUAL RUN: Make mayar_invoice_id nullable
-- =====================================================
-- This migration must be run manually on your Supabase database
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 
-- OR use Supabase CLI:
-- supabase db push
-- =====================================================

-- Remove NOT NULL constraint from mayar_invoice_id
ALTER TABLE payment_transactions 
ALTER COLUMN mayar_invoice_id DROP NOT NULL;

-- Update comment
COMMENT ON COLUMN payment_transactions.mayar_invoice_id IS 
'Invoice ID from Mayar API (populated after invoice creation, initially NULL)';

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND column_name = 'mayar_invoice_id';

-- Expected result: is_nullable should be 'YES'
