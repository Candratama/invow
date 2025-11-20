-- =====================================================
-- Migration: Make mayar_invoice_id nullable
-- Date: 20250221
-- Purpose: Allow creating payment records before calling Mayar API
--          This supports the new flow where we create the payment
--          record first, then update it with Mayar's invoice ID
-- =====================================================

-- =====================================================
-- PART 1: MAKE mayar_invoice_id NULLABLE
-- =====================================================

-- Remove NOT NULL constraint from mayar_invoice_id
-- This allows us to create payment records before we have the Mayar invoice ID
ALTER TABLE payment_transactions 
ALTER COLUMN mayar_invoice_id DROP NOT NULL;

-- =====================================================
-- PART 2: UPDATE COLUMN COMMENT
-- =====================================================

-- Update comment to reflect the new flow
COMMENT ON COLUMN payment_transactions.mayar_invoice_id IS 
'Invoice ID from Mayar API (populated after invoice creation, initially NULL)';

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Uncomment to verify the change:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'payment_transactions' 
-- AND column_name = 'mayar_invoice_id';

-- Expected result: is_nullable should be 'YES'
