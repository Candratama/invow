-- =====================================================
-- RLS Testing Queries for Invow Database
-- =====================================================
-- IMPORTANT: These queries need to be run from the APPLICATION
-- with an authenticated user, NOT from the SQL Editor!
--
-- The SQL Editor runs queries as the postgres user, which bypasses RLS.
-- To properly test RLS, you need to make requests through the Supabase client.
-- =====================================================

-- =====================================================
-- STEP 1: Check if you're authenticated
-- =====================================================
-- Run this first to check your authentication status:

SELECT
  auth.uid() AS my_user_id,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED - Cannot test RLS from SQL Editor'
    ELSE '✅ AUTHENTICATED - Can test RLS'
  END AS status;

-- If my_user_id is NULL, you have two options:
-- Option A: Use the test component (recommended - see below)
-- Option B: Manually insert test data with a real user_id

-- =====================================================
-- TEST 1: user_settings - Basic CRUD Operations
-- =====================================================

-- 1.1: SELECT (should return empty initially)
SELECT * FROM user_settings;

-- 1.2: INSERT own settings
-- NOTE: If auth.uid() is NULL, you need to test from the app or use a real UUID

-- Option A: Test from SQL Editor (BYPASSES RLS - for schema testing only)
-- Get a real user ID first:
-- SELECT id FROM auth.users LIMIT 1;

-- Then insert using that ID (replace YOUR-USER-ID):
-- INSERT INTO user_settings (
--   user_id,
--   name,
--   address,
--   whatsapp,
--   admin_name,
--   brand_color
-- )
-- VALUES (
--   'YOUR-USER-ID'::uuid,
--   'Test Store',
--   'Jl. Test No. 123, Jakarta',
--   '081234567890',
--   'Admin Test',
--   '#10b981'
-- );

-- Option B: Test from authenticated context (TESTS RLS - recommended)
-- This should be run from the application code, not SQL Editor
INSERT INTO user_settings (
  user_id,
  name,
  address,
  whatsapp,
  admin_name,
  brand_color
)
VALUES (
  auth.uid(),
  'Test Store',
  'Jl. Test No. 123, Jakarta',
  '081234567890',
  'Admin Test',
  '#10b981'
);
-- This will work if auth.uid() returns a valid user ID

-- 1.3: SELECT again (should return the row you just inserted)
SELECT * FROM user_settings;

-- 1.4: UPDATE own settings (should succeed)
UPDATE user_settings
SET name = 'Updated Store Name',
    admin_title = 'CEO'
WHERE user_id = auth.uid();

-- 1.5: Verify update
SELECT name, admin_title, updated_at FROM user_settings;
-- updated_at should be more recent than created_at

-- 1.6: Try to view another user's settings (should return empty)
-- Replace 'fake-uuid-here' with an actual UUID that's not yours
SELECT * FROM user_settings
WHERE user_id != auth.uid();

-- 1.7: DELETE own settings (should succeed)
-- WARNING: This will delete your test data
-- Uncomment to test:
-- DELETE FROM user_settings WHERE user_id = auth.uid();

-- =====================================================
-- TEST 2: invoices - Basic CRUD Operations
-- =====================================================

-- 2.1: SELECT (should return empty initially)
SELECT * FROM invoices;

-- 2.2: INSERT own invoice (should succeed)
INSERT INTO invoices (
  user_id,
  invoice_number,
  invoice_date,
  customer_name,
  customer_status,
  subtotal,
  shipping_cost,
  total,
  status
)
VALUES (
  auth.uid(),
  'INV-20250130-001',
  NOW(),
  'PT. Test Customer',
  'Distributor',
  1000000.00,
  50000.00,
  1050000.00,
  'draft'
);

-- 2.3: SELECT again (should return the invoice)
SELECT
  invoice_number,
  customer_name,
  total,
  status,
  created_at
FROM invoices;

-- 2.4: UPDATE own invoice (should succeed)
UPDATE invoices
SET status = 'synced',
    synced_at = NOW(),
    note = 'Test invoice - synced successfully'
WHERE user_id = auth.uid()
AND invoice_number = 'INV-20250130-001';

-- 2.5: Verify update
SELECT
  invoice_number,
  status,
  synced_at,
  note,
  updated_at
FROM invoices;

-- 2.6: Test unique constraint on invoice_number per user
-- This should fail with a unique violation error:
-- Uncomment to test:
-- INSERT INTO invoices (
--   user_id, invoice_number, invoice_date,
--   customer_name, subtotal, total
-- )
-- VALUES (
--   auth.uid(), 'INV-20250130-001', NOW(),
--   'Duplicate Test', 0, 0
-- );

-- 2.7: Try to view another user's invoices (should return empty)
SELECT * FROM invoices WHERE user_id != auth.uid();

-- =====================================================
-- TEST 3: invoice_items - Basic CRUD Operations
-- =====================================================

-- 3.1: Get the invoice ID from previous test
SELECT id, invoice_number FROM invoices WHERE user_id = auth.uid();
-- Copy the 'id' value for use in the next queries

-- 3.2: INSERT invoice items (should succeed)
-- Replace 'YOUR-INVOICE-ID-HERE' with the actual UUID from step 3.1
DO $$
DECLARE
  v_invoice_id UUID;
BEGIN
  -- Get the invoice ID
  SELECT id INTO v_invoice_id
  FROM invoices
  WHERE user_id = auth.uid()
  AND invoice_number = 'INV-20250130-001'
  LIMIT 1;

  -- Insert items
  INSERT INTO invoice_items (invoice_id, description, quantity, price, subtotal, position)
  VALUES
    (v_invoice_id, 'Product A - Test Item 1', 10, 50000.00, 500000.00, 0),
    (v_invoice_id, 'Product B - Test Item 2', 5, 100000.00, 500000.00, 1);
END $$;

-- 3.3: SELECT invoice items (should return 2 items)
SELECT
  i.invoice_number,
  ii.description,
  ii.quantity,
  ii.price,
  ii.subtotal,
  ii.position
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.user_id = auth.uid()
ORDER BY ii.position;

-- 3.4: UPDATE invoice item (should succeed)
UPDATE invoice_items
SET quantity = 15,
    subtotal = 750000.00
WHERE invoice_id IN (
  SELECT id FROM invoices WHERE user_id = auth.uid()
)
AND description = 'Product A - Test Item 1';

-- 3.5: Verify update
SELECT description, quantity, subtotal, updated_at
FROM invoice_items
WHERE invoice_id IN (
  SELECT id FROM invoices WHERE user_id = auth.uid()
)
ORDER BY position;

-- 3.6: Test CHECK constraints
-- This should fail (quantity must be > 0):
-- Uncomment to test:
-- UPDATE invoice_items
-- SET quantity = 0
-- WHERE invoice_id IN (
--   SELECT id FROM invoices WHERE user_id = auth.uid()
-- )
-- LIMIT 1;

-- This should fail (price must be >= 0):
-- Uncomment to test:
-- UPDATE invoice_items
-- SET price = -100
-- WHERE invoice_id IN (
--   SELECT id FROM invoices WHERE user_id = auth.uid()
-- )
-- LIMIT 1;

-- =====================================================
-- TEST 4: Cascade Deletes
-- =====================================================

-- 4.1: Delete invoice (should cascade delete all items)
-- WARNING: This will delete your test data
-- Uncomment to test:
-- DELETE FROM invoices
-- WHERE user_id = auth.uid()
-- AND invoice_number = 'INV-20250130-001';

-- 4.2: Verify items are deleted
-- SELECT * FROM invoice_items; -- Should be empty

-- =====================================================
-- TEST 5: Cross-User Security (requires 2 users)
-- =====================================================

-- This test requires you to create a second user and run queries
-- from both accounts to verify RLS is working correctly.

-- As User A:
-- 1. Create user_settings, invoice, and items
-- 2. Note the IDs

-- As User B:
-- 1. Try to SELECT User A's data (should return empty)
-- 2. Try to UPDATE User A's data (should fail or affect 0 rows)
-- 3. Try to DELETE User A's data (should fail or affect 0 rows)

-- Example (run as User B with User A's invoice_id):
-- SELECT * FROM invoices WHERE id = 'user-a-invoice-id';
-- Should return empty even though the invoice exists

-- =====================================================
-- TEST 6: Performance - Check Indexes
-- =====================================================

-- Verify indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('user_settings', 'invoices', 'invoice_items')
ORDER BY tablename, indexname;

-- Expected indexes:
-- user_settings: idx_user_settings_user_id
-- invoices: idx_invoices_user_id, idx_invoices_status, idx_invoices_date, idx_invoices_number
-- invoice_items: idx_invoice_items_invoice_id, idx_invoice_items_position

-- =====================================================
-- TEST 7: Triggers - updated_at auto-update
-- =====================================================

-- This was already tested in previous UPDATEs
-- But here's a dedicated test:

-- Insert a record
INSERT INTO user_settings (user_id, name, address, whatsapp, admin_name)
VALUES (auth.uid(), 'Trigger Test', 'Test', '08123', 'Admin')
ON CONFLICT (user_id) DO UPDATE SET name = 'Trigger Test';

-- Note the timestamps
SELECT name, created_at, updated_at
FROM user_settings
WHERE user_id = auth.uid();
-- created_at and updated_at should be the same initially

-- Wait a moment and update
SELECT pg_sleep(2);
UPDATE user_settings
SET name = 'Trigger Test Updated'
WHERE user_id = auth.uid();

-- Check timestamps again
SELECT name, created_at, updated_at
FROM user_settings
WHERE user_id = auth.uid();
-- updated_at should now be newer than created_at

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- Run this to clean up all test data:
-- WARNING: This deletes all your data!
/*
DELETE FROM invoice_items
WHERE invoice_id IN (
  SELECT id FROM invoices WHERE user_id = auth.uid()
);

DELETE FROM invoices WHERE user_id = auth.uid();
DELETE FROM user_settings WHERE user_id = auth.uid();
*/

-- =====================================================
-- SUCCESS CRITERIA
-- =====================================================

-- All tests passed if:
-- ✅ You can INSERT, SELECT, UPDATE your own data
-- ✅ You CANNOT see other users' data
-- ✅ You CANNOT modify other users' data
-- ✅ CHECK constraints prevent invalid data
-- ✅ UNIQUE constraints prevent duplicates
-- ✅ CASCADE deletes work properly
-- ✅ Indexes exist for performance
-- ✅ Triggers auto-update timestamps
-- ✅ Foreign keys maintain referential integrity

-- =====================================================
