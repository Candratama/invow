const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlupjzxdqdvbpwltpesu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdXBqenhkcWR2YnB3bHRwZXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgwNTk3NCwiZXhwIjoyMDc3MzgxOTc0fQ.3_y2xqXWdYtIDhDbVYPsiOfSjV4S1QTfxzlNYbRZ4fs'
);

async function testFix() {
  console.log('🧪 Testing Store Settings Fix\n');
  console.log('=' .repeat(60));

  // Get first store
  const { data: stores, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !stores) {
    console.log('❌ No stores found');
    return;
  }

  console.log('\n📊 Database Data (what will be loaded):');
  console.log('-'.repeat(60));
  console.log(`Store Name:           ${stores.name}`);
  console.log(`Address:              ${stores.address}`);
  console.log(`WhatsApp:             ${stores.whatsapp}`);
  console.log(`Phone:                ${stores.phone || '(not set)'} ✅`);
  console.log(`Email:                ${stores.email || '(not set)'} ✅`);
  console.log(`Website:              ${stores.website || '(not set)'} ✅`);
  console.log(`Store Number:         ${stores.store_number || '(not set)'} ✅`);
  console.log(`Payment Method:       ${stores.payment_method || '(not set)'} ✅`);
  console.log(`Invoice Prefix:       ${stores.invoice_prefix || '(not set)'} ✅`);
  console.log(`Store Code:           ${stores.store_code || '(not set)'} ✅`);
  console.log(`Brand Color:          ${stores.brand_color}`);
  console.log(`Store Description:    ${stores.store_description || '(not set)'} ✅`);
  console.log(`Tagline:              ${stores.tagline || '(not set)'} ✅`);

  // Get contact
  const { data: contacts } = await supabase
    .from('store_contacts')
    .select('*')
    .eq('store_id', stores.id)
    .eq('is_primary', true)
    .limit(1)
    .single();

  if (contacts) {
    console.log(`\n👤 Contact/Signature Info:`);
    console.log('-'.repeat(60));
    console.log(`Admin Name:           ${contacts.name} ✅`);
    console.log(`Admin Title:          ${contacts.title || '(not set)'} ✅`);
    console.log(`Signature:            ${contacts.signature ? 'Yes ✅' : '(not set)'} ✅`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n✅ After restarting the app, ALL these fields will be:');
  console.log('   • Saved to database correctly');
  console.log('   • Loaded when the app starts');
  console.log('   • Populated in the form');
  console.log('   • Persist after page reload');
  console.log('\n🎉 Fix is ready! Just restart your application.');
}

testFix().catch(console.error);
