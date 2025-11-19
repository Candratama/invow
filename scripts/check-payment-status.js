/**
 * Check payment status in database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRANSACTION_ID = '01a2cf96-0602-4296-a44c-66290fe73c1e';

async function checkPaymentStatus() {
  console.log('='.repeat(60));
  console.log('Checking Payment Status');
  console.log('='.repeat(60));
  console.log('Transaction ID:', TRANSACTION_ID);
  console.log('');

  // Check payment_transactions table
  const { data: payment, error: paymentError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('mayar_invoice_id', TRANSACTION_ID)
    .single();

  if (paymentError) {
    console.log('❌ Payment not found in database');
    console.log('Error:', paymentError.message);
    console.log('');
    console.log('This means the invoice was not created properly.');
    console.log('Check the create invoice logs.');
    return;
  }

  console.log('✅ Payment found in database:');
  console.log('- ID:', payment.id);
  console.log('- User ID:', payment.user_id);
  console.log('- Mayar Invoice ID:', payment.mayar_invoice_id);
  console.log('- Amount:', payment.amount);
  console.log('- Tier:', payment.tier);
  console.log('- Status:', payment.status);
  console.log('- Payment Method:', payment.payment_method);
  console.log('- Created At:', payment.created_at);
  console.log('- Completed At:', payment.completed_at);
  console.log('- Webhook Verified At:', payment.webhook_verified_at);
  console.log('');

  // Check user subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', payment.user_id)
    .single();

  if (subError) {
    console.log('❌ Subscription not found');
    console.log('Error:', subError.message);
    return;
  }

  console.log('📊 User Subscription:');
  console.log('- Tier:', subscription.tier);
  console.log('- Invoice Limit:', subscription.invoice_limit);
  console.log('- Current Month Count:', subscription.current_month_count);
  console.log('- Remaining:', subscription.invoice_limit - subscription.current_month_count);
  console.log('- Subscription Start:', subscription.subscription_start_date);
  console.log('- Subscription End:', subscription.subscription_end_date);
  console.log('- Month Year:', subscription.month_year);
  console.log('');

  if (payment.status === 'pending') {
    console.log('⚠️  Payment is still PENDING');
    console.log('');
    console.log('Possible reasons:');
    console.log('1. Webhook was not processed successfully');
    console.log('2. Transaction ID mismatch between create and webhook');
    console.log('3. Error in handlePaymentSuccess function');
    console.log('');
    console.log('Check server logs for webhook processing errors.');
  } else if (payment.status === 'completed') {
    console.log('✅ Payment is COMPLETED');
    console.log('Subscription should be updated.');
  }

  console.log('='.repeat(60));
}

checkPaymentStatus().catch(console.error);
