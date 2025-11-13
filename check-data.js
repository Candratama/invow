const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlupjzxdqdvbpwltpesu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdXBqenhkcWR2YnB3bHRwZXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgwNTk3NCwiZXhwIjoyMDc3MzgxOTc0fQ.3_y2xqXWdYtIDhDbVYPsiOfSjV4S1QTfxzlNYbRZ4fs'
);

async function checkData() {
  console.log('🔍 Checking store data...\n');

  // Check new stores table
  console.log('1️⃣ Checking STORES table:');
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true);

  if (storesError) {
    console.error('❌ Error:', storesError);
  } else {
    const count = stores ? stores.length : 0;
    console.log(`✅ Found ${count} active stores`);
    if (stores) {
      stores.forEach(store => {
        console.log(`\n📝 Store: ${store.name}`);
        console.log(`   ID: ${store.id}`);
        console.log(`   Store Number: ${store.store_number || '(null)'} ❌`);
        console.log(`   Payment Method: ${store.payment_method || '(null)'} ❌`);
        console.log(`   Invoice Prefix: ${store.invoice_prefix || '(null)'} ❌`);
        console.log(`   Website: ${store.website || '(null)'} ❌`);
      });
    }
  }

  // Check old user_settings table
  console.log('\n\n2️⃣ Checking USER_SETTINGS_DEPRECATED table:');
  const { data: oldSettings, error: oldError } = await supabase
    .from('user_settings_deprecated')
    .select('*');

  if (oldError) {
    console.error('❌ Error:', oldError);
  } else {
    const count = oldSettings ? oldSettings.length : 0;
    console.log(`✅ Found ${count} old settings`);
    if (oldSettings) {
      oldSettings.forEach(setting => {
        console.log(`\n📝 Store: ${setting.name}`);
        console.log(`   Store Number: ${setting.store_number || '(null)'} ❌`);
        console.log(`   Payment Method: ${setting.payment_method || '(null)'} ❌`);
      });
    }
  }

  // Check if data was NOT migrated properly
  console.log('\n\n3️⃣ Diagnosis:');
  console.log('The migration created the NEW stores table with all fields.');
  console.log('But the OLD data from user_settings_deprecated might NOT have been copied!');
  console.log('\nIf you see store_number/payment_method as (null) above,');
  console.log('it means the data needs to be copied from the old table.');
}

checkData().catch(console.error);
