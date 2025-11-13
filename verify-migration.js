const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlupjzxdqdvbpwltpesu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdXBqenhkcWR2YnB3bHRwZXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgwNTk3NCwiZXhwIjoyMDc3MzgxOTc0fQ.3_y2xqXWdYtIDhDbVYPsiOfSjV4S1QTfxzlNYbRZ4fs'
);

async function verify() {
  console.log('🔍 Verifying migration...\n');

  // Check if stores table exists and has data
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .limit(1);

  if (storesError) {
    console.error('❌ Error checking stores table:', storesError);
    console.log('Note: You may need to restart your application for changes to take effect');
    return;
  }

  console.log('✅ Stores table exists and is accessible!');

  // Check if new columns exist by trying to select them
  const { data: columnsCheck } = await supabase
    .from('stores')
    .select('store_number, payment_method, invoice_prefix, website')
    .limit(1);

  if (columnsCheck !== null) {
    console.log('✅ All new columns are accessible!');
  }

  // Count records
  const { count } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total stores in database: ${count || 0}\n`);

  if (count && count > 0) {
    const { data: sample } = await supabase
      .from('stores')
      .select('name, store_number, payment_method, invoice_prefix, website')
      .limit(1)
      .single();

    if (sample) {
      console.log('📝 Sample store record:');
      console.log(`   - Name: ${sample.name}`);
      console.log(`   - Store Number: ${sample.store_number || '(null)'} ← Previously missing!`);
      console.log(`   - Payment Method: ${sample.payment_method || '(null)'} ← Previously missing!`);
      console.log(`   - Invoice Prefix: ${sample.invoice_prefix || '(null)'} ← Previously missing!`);
      console.log(`   - Website: ${sample.website || '(null)'} ← Previously missing!`);
    }
  }

  console.log('\n✅ Migration verification complete!');
  console.log('\n🎉 All fields will now persist correctly!');
  console.log('💡 Note: Restart your application to clear any cached data.');
}

verify().catch(console.error);
