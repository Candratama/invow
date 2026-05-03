-- =====================================================
-- Migration: Add payment reconciliation columns
-- Date: 20260503
-- Purpose: Add columns for cron-based payment reconciliation
--          and redirect-first + cron-fallback payment verification
-- =====================================================

-- =====================================================
-- PART 1: ADD RECONCILIATION COLUMNS
-- =====================================================

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS poll_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_via TEXT
    CHECK (verified_via IN ('redirect', 'cron', 'manual') OR verified_via IS NULL),
  ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- =====================================================
-- PART 2: CREATE PARTIAL INDEX FOR CRON SWEEP
-- =====================================================

-- Partial index to speed up cron sweep queries
-- Only indexes pending transactions for faster reconciliation
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pending_for_cron
  ON payment_transactions (created_at)
  WHERE status = 'pending';

-- =====================================================
-- PART 3: ADD COLUMN COMMENTS
-- =====================================================

COMMENT ON COLUMN payment_transactions.last_polled_at IS
  'Last time cron or verify attempted to reconcile this payment with Mayar.';

COMMENT ON COLUMN payment_transactions.poll_count IS
  'Total number of Mayar reconciliation attempts (redirect + cron).';

COMMENT ON COLUMN payment_transactions.verified_via IS
  'Channel that flipped status from pending to completed: redirect | cron | manual.';

COMMENT ON COLUMN payment_transactions.payment_url IS
  'Mayar payment link URL stored for idempotency reuse within a 5-minute window.';

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Uncomment these to verify migration:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'payment_transactions'
-- AND column_name IN ('last_polled_at', 'poll_count', 'verified_via', 'payment_url')
-- ORDER BY column_name;

-- Verify partial index:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'payment_transactions'
-- AND indexname = 'idx_payment_transactions_pending_for_cron';
