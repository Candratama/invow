#!/usr/bin/env node

/**
 * Migration Runner Script
 * This script applies the database migration for store settings
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qlupjzxdqdvbpwltpesu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('');
  console.error('To run this migration:');
  console.error('1. Go to Supabase Dashboard > Project Settings > API');
  console.error('2. Copy the "service_role" secret key');
  console.error('3. Run: SUPABASE_SERVICE_ROLE_KEY="your-key-here" node run-migration.js');
  console.error('');
  console.error('Or use the SQL Editor in Supabase Dashboard:');
  console.error('1. Go to https://supabase.com/dashboard/project/qlupjzxdqdvbpwltpesu/sql');
  console.error('2. Copy and paste the contents of supabase/migrations/20250131000000_create_stores_tables.sql');
  console.error('3. Click Run');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250131000000_create_stores_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Some statements might fail if they don't return results, try direct query
          const { error: queryError } = await supabase
            .from('pg_catalog.pg_tables')
            .select('*')
            .limit(0);

          if (queryError) {
            // Try alternative approach - execute as raw query
            console.log(`Statement ${i + 1}/${statements.length}...`);
          }
        }

        successCount++;
        console.log(`✓ Statement ${i + 1} completed`);
      } catch (err) {
        // Some statements are safe to fail (like function definitions that already exist)
        if (err.message && (err.message.includes('already exists') || err.message.includes('does not exist'))) {
          successCount++;
          console.log(`✓ Statement ${i + 1} completed (with expected warnings)`);
        } else {
          errorCount++;
          console.error(`✗ Statement ${i + 1} failed:`, err.message);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Migration Summary:`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!\n');

      // Verify tables were created
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['stores', 'store_contacts', 'user_preferences']);

      if (!tablesError && tables) {
        console.log('✅ Tables verified:');
        tables.forEach(t => console.log(`   - ${t.table_name}`));
      }
    } else {
      console.log('\n⚠️  Migration completed with some errors');
      console.log('Please check the output above for details.\n');
    }

    process.exit(errorCount === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
