-- =====================================================
-- Migration: Create Subscription Management Tables
-- Date: 20250219
-- Purpose: Add tables for Mayar payment integration
--          and subscription tier management
-- =====================================================

-- =====================================================
-- TABLE: user_subscriptions
-- =====================================================

-- Stores user subscription tier and invoice limits
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'pro')) DEFAULT 'free',
  invoice_limit INTEGER NOT NULL DEFAULT 30,
  current_month_count INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- YYYY-MM format
  subscription_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_end_date TIMESTAMPTZ, -- nullable for ongoing subscriptions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One subscription per user
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_month_year ON user_subscriptions(month_year);

-- Trigger to update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: payment_transactions
-- =====================================================

-- Stores payment transaction history
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mayar_invoice_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- in rupiah
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'expired')) DEFAULT 'pending',
  payment_method TEXT, -- nullable, populated after payment
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ, -- nullable, set when payment completes
  webhook_verified_at TIMESTAMPTZ, -- nullable, set when webhook verified
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_mayar_invoice_id ON payment_transactions(mayar_invoice_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: invoice_usage
-- =====================================================

-- Tracks monthly invoice usage per user
CREATE TABLE invoice_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- YYYY-MM format
  invoice_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_year) -- One record per user per month
);

-- Indexes for performance
CREATE INDEX idx_invoice_usage_user_id ON invoice_usage(user_id);
CREATE INDEX idx_invoice_usage_month_year ON invoice_usage(month_year);
CREATE INDEX idx_invoice_usage_user_month ON invoice_usage(user_id, month_year);

-- Trigger to update updated_at
CREATE TRIGGER update_invoice_usage_updated_at
  BEFORE UPDATE ON invoice_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies: user_subscriptions
-- =====================================================

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscription
CREATE POLICY "Users can delete own subscription"
  ON user_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies: payment_transactions
-- =====================================================

-- Users can view their own payment transactions
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payment transactions
CREATE POLICY "Users can insert own payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment transactions
CREATE POLICY "Users can update own payment transactions"
  ON payment_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own payment transactions
CREATE POLICY "Users can delete own payment transactions"
  ON payment_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies: invoice_usage
-- =====================================================

-- Users can view their own invoice usage
CREATE POLICY "Users can view own invoice usage"
  ON invoice_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own invoice usage
CREATE POLICY "Users can insert own invoice usage"
  ON invoice_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own invoice usage
CREATE POLICY "Users can update own invoice usage"
  ON invoice_usage FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own invoice usage
CREATE POLICY "Users can delete own invoice usage"
  ON invoice_usage FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_subscriptions IS 'Stores user subscription tier and monthly invoice limits';
COMMENT ON TABLE payment_transactions IS 'Stores payment transaction history with Mayar';
COMMENT ON TABLE invoice_usage IS 'Tracks monthly invoice usage per user';

COMMENT ON COLUMN user_subscriptions.tier IS 'Subscription tier: free (30/month), starter (200/month), pro (unlimited)';
COMMENT ON COLUMN user_subscriptions.invoice_limit IS 'Maximum invoices allowed per month for this tier';
COMMENT ON COLUMN user_subscriptions.current_month_count IS 'Number of invoices generated in current month';
COMMENT ON COLUMN user_subscriptions.month_year IS 'Current month in YYYY-MM format';

COMMENT ON COLUMN payment_transactions.mayar_invoice_id IS 'Unique invoice ID from Mayar payment gateway';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount in Indonesian Rupiah (IDR)';
COMMENT ON COLUMN payment_transactions.status IS 'Payment status: pending, completed, failed, or expired';
COMMENT ON COLUMN payment_transactions.webhook_verified_at IS 'Timestamp when webhook signature was verified';

COMMENT ON COLUMN invoice_usage.month_year IS 'Month in YYYY-MM format for tracking usage';
COMMENT ON COLUMN invoice_usage.invoice_count IS 'Number of invoices generated in this month';
