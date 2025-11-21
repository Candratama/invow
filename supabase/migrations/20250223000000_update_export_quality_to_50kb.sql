-- =====================================================
-- Update Export Quality: Change Small from 70KB to 50KB
-- Migration: 20250223000000_update_export_quality_to_50kb
-- =====================================================

-- Drop the old CHECK constraint
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_export_quality_kb_check;

-- Add new CHECK constraint with updated values
-- Valid values: 50 (Small), 100 (Medium), 150 (High)
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_export_quality_kb_check 
  CHECK (export_quality_kb IN (50, 100, 150));

-- Update existing records that have 70 to 50
UPDATE user_preferences
SET export_quality_kb = 50
WHERE export_quality_kb = 70;

-- Update comment for documentation
COMMENT ON COLUMN user_preferences.export_quality_kb IS 'Export quality limit in KB: 50 (Small), 100 (Medium), 150 (High)';
