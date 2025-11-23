-- =====================================================
-- Add Selected Template to user_preferences
-- Migration: 20250224000000_add_selected_template_to_user_preferences
-- =====================================================

-- Add selected_template column with CHECK constraint
-- Valid values: classic, simple, modern, elegant, bold, compact, creative, corporate
-- Default to 'classic' template
ALTER TABLE user_preferences
ADD COLUMN selected_template TEXT DEFAULT 'classic'
  CHECK (selected_template IN ('classic', 'simple', 'modern', 'elegant', 'bold', 'compact', 'creative', 'corporate'));

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.selected_template IS 'Selected invoice template: classic, simple, modern, elegant, bold, compact, creative, or corporate';
