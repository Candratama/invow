-- =====================================================
-- Migration: Add Performance Indexes for Reports Page
-- Date: 20260101
-- =====================================================
-- Purpose: Optimize date range queries and customer type analysis
-- for the premium reports dashboard

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_invoices_date_synced
ON invoices(user_id, invoice_date DESC)
WHERE status = 'synced';

-- Index for customer type analysis
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status
ON invoices(user_id, customer_status, invoice_date)
WHERE status = 'synced';

COMMENT ON INDEX idx_invoices_date_synced IS 'Partial index for reports: user + invoice date on synced invoices only';
COMMENT ON INDEX idx_invoices_customer_status IS 'Partial index for reports: customer breakdown by invoice date on synced invoices';
