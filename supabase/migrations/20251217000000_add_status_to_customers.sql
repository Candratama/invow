-- =====================================================
-- Migration: Add status field to customers table
-- Date: 20251217
-- Feature: Customer Management - Status field
-- =====================================================

-- Add status column to customers table
-- Values: 'Customer', 'Reseller', 'Distributor'
ALTER TABLE customers 
ADD COLUMN status TEXT NOT NULL DEFAULT 'Customer' 
CHECK (status IN ('Customer', 'Reseller', 'Distributor'));

-- Add comment for documentation
COMMENT ON COLUMN customers.status IS 'Customer status: Customer, Reseller, or Distributor';
