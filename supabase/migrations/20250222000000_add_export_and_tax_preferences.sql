-- =====================================================
-- Add Export Quality and Tax Preferences to user_preferences
-- Migration: 20250222000000_add_export_and_tax_preferences
-- =====================================================

-- Add export_quality_kb column with CHECK constraint
-- Valid values: 70 (Small), 100 (Medium), 150 (High)
ALTER TABLE user_preferences
ADD COLUMN export_quality_kb INTEGER DEFAULT 100 
  CHECK (export_quality_kb IN (70, 100, 150));

-- Add tax_enabled column
ALTER TABLE user_preferences
ADD COLUMN tax_enabled BOOLEAN DEFAULT false;

-- Add tax_percentage column with CHECK constraint
-- Valid range: 0-100
ALTER TABLE user_preferences
ADD COLUMN tax_percentage NUMERIC(5,2) DEFAULT 0 
  CHECK (tax_percentage >= 0 AND tax_percentage <= 100);

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.export_quality_kb IS 'Export quality limit in KB: 70 (Small), 100 (Medium), 150 (High)';
COMMENT ON COLUMN user_preferences.tax_enabled IS 'Whether tax calculation is enabled for invoices';
COMMENT ON COLUMN user_preferences.tax_percentage IS 'Tax percentage to apply (0-100), null when tax is disabled';
