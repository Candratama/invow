/**
 * Manually process webhook for a specific transaction
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

async function processWebhook() {
  console.log('='.repeat(60));
  console.log('Manually Processing Webhook');
  console.log('='.repeat(60));
  console.log('Transaction ID:', TRANSACTION_ID);
  console.log('');

  // 1. Get payment transaction
  const { data: payment, error: paymentError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('mayar_invoice_id', TRANSACTION_ID)
    .single();

  if (paymentError) {
    console.log('❌ Payment not found:', paymentError.message);
    return;
  }

  console.log('✅ Found payment:');
  console.log('- ID:', payment.id);
  console.log('- User ID:', payment.user_id);
  console.log('- Tier:', payment.tier);
  console.log('- Amount:', payment.amount);
  console.log('- Current Status:', payment.status);
  console.log('');

  if (payment.status === 'completed') {
    console.log('⚠️  Payment already completed');
    return;
  }

  // 2. Update payment status
  console.log('Updating payment status to completed...');
  const paymentMethod = process.argv[2] || 'QRIS'; // Allow passing payment method as argument
  console.log('Payment method:', paymentMethod);
  
  const { error: updateError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      payment_method: paymentMethod,
      completed_at: new Date().toISOString(),
      webhook_verified_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (updateError) {
    console.log('❌ Failed to update payment:', updateError.message);
    return;
  }

  console.log('✅ Payment status updated to completed');
  console.log('');

  // 3. Get current subscription
  const { data: currentSub, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', payment.user_id)
    .single();

  if (subError) {
    console.log('❌ Failed to get subscription:', subError.message);
    return;
  }

  console.log('📊 Current Subscription:');
  console.log('- Tier:', currentSub.tier);
  console.log('- Invoice Limit:', currentSub.invoice_limit);
  console.log('- Current Count:', currentSub.current_month_count);
  console.log('- Remaining:', currentSub.invoice_limit - currentSub.current_month_count);
  console.log('- End Date:', currentSub.subscription_end_date);
  console.log('');

  // 4. Calculate new subscription values
  const now = new Date();
  const tierLimits = {
    free: 30,
    starter: 200,
    pro: 999999
  };

  const newLimit = tierLimits[payment.tier];
  let newInvoiceLimit;
  let newEndDate;
  let newStartDate;

  // Calculate remaining credits
  const remainingCredits = Math.max(0, currentSub.invoice_limit - currentSub.current_month_count);

  if (currentSub.subscription_end_date) {
    const currentEndDate = new Date(currentSub.subscription_end_date);
    
    if (currentEndDate > now) {
      // Active subscription - accumulate credits and extend
      const extendedEndDate = new Date(currentEndDate);
      extendedEndDate.setDate(extendedEndDate.getDate() + 30);
      
      newStartDate = currentSub.subscription_start_date;
      newEndDate = extendedEndDate.toISOString();
      newInvoiceLimit = remainingCredits + newLimit;
      
      console.log('🔄 Extending active subscription:');
      console.log('- Remaining credits:', remainingCredits);
      console.log('- New credits:', newLimit);
      console.log('- Total credits:', newInvoiceLimit);
      console.log('- Extending from:', currentEndDate.toISOString());
      console.log('- New end date:', newEndDate);
    } else {
      // Expired subscription - start fresh
      newStartDate = now.toISOString();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
      newEndDate = endDate.toISOString();
      newInvoiceLimit = newLimit;
      
      console.log('🆕 Starting new subscription (expired):');
      console.log('- New credits:', newInvoiceLimit);
      console.log('- Start date:', newStartDate);
      console.log('- End date:', newEndDate);
    }
  } else {
    // No end date - first time
    newStartDate = now.toISOString();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    newEndDate = endDate.toISOString();
    newInvoiceLimit = newLimit;
    
    console.log('🆕 Starting new subscription (first time):');
    console.log('- New credits:', newInvoiceLimit);
    console.log('- Start date:', newStartDate);
    console.log('- End date:', newEndDate);
  }

  console.log('');

  // 5. Update subscription
  console.log('Updating subscription...');
  const newCycle = newStartDate.substring(0, 10);
  
  const { error: upgradeError } = await supabase
    .from('user_subscriptions')
    .update({
      tier: payment.tier,
      invoice_limit: newInvoiceLimit,
      current_month_count: 0,
      subscription_start_date: newStartDate,
      subscription_end_date: newEndDate,
      month_year: newCycle,
    })
    .eq('user_id', payment.user_id);

  if (upgradeError) {
    console.log('❌ Failed to update subscription:', upgradeError.message);
    return;
  }

  console.log('✅ Subscription updated successfully!');
  console.log('');
  console.log('='.repeat(60));
  console.log('FINAL STATUS:');
  console.log('='.repeat(60));
  console.log('Payment Status: completed');
  console.log('Subscription Tier:', payment.tier);
  console.log('Invoice Limit:', newInvoiceLimit);
  console.log('Expires:', newEndDate);
  console.log('='.repeat(60));
}

processWebhook().catch(console.error);
