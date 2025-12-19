-- =====================================================
-- Migration: Create Customers Table and Link to Invoices
-- Date: 20251216
-- Feature: Customer Management
-- Requirements: 5.1, 5.2, 5.4, 5.5, 6.1, 6.2, 6.3, 2.3
-- =====================================================

-- =====================================================
-- PART 1: ENABLE pg_trgm EXTENSION FOR FUZZY SEARCH
-- =====================================================

-- Enable pg_trgm extension for trigram-based fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- PART 2: CREATE customers TABLE
-- =====================================================

-- Customers table to store reusable customer information per store
-- Requirements: 5.1, 6.1, 6.2, 6.3
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Customer information with validation constraints
  name TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  phone TEXT NOT NULL CHECK (phone ~ '^\+?[0-9]{8,15}$'),
  address TEXT NOT NULL CHECK (length(trim(address)) >= 5),
  email TEXT,
  notes TEXT,
  
  -- Soft delete flag for preserving invoice history
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 3: ADD customer_id TO invoices TABLE
-- =====================================================

-- Add nullable customer_id column for backward compatibility
-- Requirements: 5.2, 5.4
ALTER TABLE invoices 
ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- =====================================================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on store_id for filtering customers by store
-- Requirements: 2.3
CREATE INDEX idx_customers_store_id ON customers(store_id);

-- Trigram index on name for fuzzy search
-- Requirements: 2.3
CREATE INDEX idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);

-- Composite index for active customers per store
-- Requirements: 2.3
CREATE INDEX idx_customers_store_active ON customers(store_id, is_active);

-- Index on customer_id in invoices for lookups
-- Requirements: 5.2
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);

-- =====================================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on customers table
-- Requirements: 5.5
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can view customers from their own stores
CREATE POLICY "Users can view customers from their stores"
  ON customers FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- INSERT policy: Users can add customers to their own stores
CREATE POLICY "Users can insert customers to their stores"
  ON customers FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy: Users can modify customers from their own stores
CREATE POLICY "Users can update customers from their stores"
  ON customers FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- DELETE policy: Users can delete customers from their own stores
-- Note: Soft delete is preferred, but hard delete is allowed
CREATE POLICY "Users can delete customers from their stores"
  ON customers FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PART 6: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE customers IS 'Stores reusable customer information per store for invoice creation';

COMMENT ON COLUMN customers.store_id IS 'Reference to the store that owns this customer';
COMMENT ON COLUMN customers.name IS 'Customer name (minimum 2 characters)';
COMMENT ON COLUMN customers.phone IS 'Indonesian phone format: optional + prefix, 8-15 digits';
COMMENT ON COLUMN customers.address IS 'Customer address (minimum 5 characters)';
COMMENT ON COLUMN customers.email IS 'Optional customer email';
COMMENT ON COLUMN customers.notes IS 'Internal notes about the customer';
COMMENT ON COLUMN customers.is_active IS 'Soft delete flag - false means customer is deleted but preserved for history';

COMMENT ON COLUMN invoices.customer_id IS 'Optional reference to saved customer - null for manual entry';
