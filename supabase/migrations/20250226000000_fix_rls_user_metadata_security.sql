-- =====================================================
-- Migration: Fix RLS Security Vulnerability
-- Date: 20250226
-- Purpose: Replace insecure user_metadata references with
--          app_metadata in RLS policies for admin checks
-- 
-- SECURITY FIX: user_metadata is editable by end users
-- and should never be used in security contexts.
-- app_metadata can only be modified by service role.
-- =====================================================

-- =====================================================
-- FIX: subscription_plans RLS Policies
-- =====================================================

-- Drop insecure policies
DROP POLICY IF EXISTS "Admin can view all plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin can update plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin can insert plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admin can delete plans" ON subscription_plans;

-- Create secure policies using app_metadata
CREATE POLICY "Admin can view all plans"
  ON subscription_plans FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Admin can update plans"
  ON subscription_plans FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Admin can insert plans"
  ON subscription_plans FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Admin can delete plans"
  ON subscription_plans FOR DELETE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- =====================================================
-- FIX: template_access_rules RLS Policies
-- =====================================================

-- Drop insecure policies
DROP POLICY IF EXISTS "Admins can update template access rules" ON template_access_rules;
DROP POLICY IF EXISTS "Admins can insert template access rules" ON template_access_rules;

-- Create secure policies using app_metadata
CREATE POLICY "Admins can update template access rules"
  ON template_access_rules FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Admins can insert template access rules"
  ON template_access_rules FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- =====================================================
-- IMPORTANT: Manual Step Required
-- =====================================================
-- After running this migration, you need to update your
-- admin users to have is_admin in app_metadata instead
-- of user_metadata. Run this in Supabase SQL Editor:
--
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
-- WHERE raw_user_meta_data ->> 'is_admin' = 'true';
--
-- Or use the Supabase Admin API to update app_metadata
-- for specific admin users.
-- =====================================================
