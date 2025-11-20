/**
 * Test Payment Verification Script
 * 
 * This script allows you to manually test payment verification
 * for existing payment records in the database.
 * 
 * Usage:
 * 1. Find your payment record ID in Supabase
 * 2. Run: npx tsx scripts/test-payment-verification.ts <payment_id>
 */

import { createClient } from '@supabase/supabase-js';
import { MayarPaymentService } from '../lib/db/services/mayar-payment.service';

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Get payment ID from command line
const paymentId = process.argv[2];

if (!paymentId) {
  console.error('❌ Missing payment ID');
  console.error('Usage: npx tsx scripts/test-payment-verification.ts <payment_id>');
  process.exit(1);
}

async function testVerification() {
  console.log('🔍 Testing Payment Verification');
  console.log('================================\n');
  
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  
  // Create payment service
  const paymentService = new MayarPaymentService(supabase);
  
  console.log(`📋 Payment ID: ${paymentId}\n`);
  
  // First, check if payment record exists
  console.log('1️⃣ Checking payment record in database...');
  const { data: payment, error: fetchError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', paymentId)
    .single();
  
  if (fetchError || !payment) {
    console.error('❌ Payment record not found');
    console.error('Error:', fetchError?.message);
    process.exit(1);
  }
  
  console.log('✅ Payment record found:');
  console.log(`   User ID: ${payment.user_id}`);
  console.log(`   Mayar Invoice ID: ${payment.mayar_invoice_id || 'NULL'}`);
  console.log(`   Status: ${payment.status}`);
  console.log(`   Tier: ${payment.tier}`);
  console.log(`   Amount: ${payment.amount}`);
  console.log('');
  
  if (!payment.mayar_invoice_id) {
    console.error('❌ Payment record has no Mayar invoice ID');
    console.error('This payment was not properly created with Mayar');
    process.exit(1);
  }
  
  if (payment.status === 'completed') {
    console.log('⚠️  Payment is already completed');
    console.log('Verification will return current subscription details');
    console.log('');
  }
  
  // Verify payment
  console.log('2️⃣ Verifying payment with Mayar API...');
  console.log('This may take a few seconds...\n');
  
  try {
    const result = await paymentService.verifyAndProcessPaymentByRecordId(
      payment.user_id,
      paymentId
    );
    
    if (result.error) {
      console.error('❌ Verification failed:');
      console.error(`   Error: ${result.error.message}`);
      process.exit(1);
    }
    
    console.log('✅ Verification successful!');
    console.log('');
    console.log('📊 Result:');
    console.log(`   Subscription Tier: ${result.data?.subscription.tier}`);
    console.log(`   Expires At: ${result.data?.subscription.expiresAt}`);
    console.log('');
    
    // Check updated payment record
    console.log('3️⃣ Checking updated payment record...');
    const { data: updatedPayment } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (updatedPayment) {
      console.log('✅ Payment record updated:');
      console.log(`   Status: ${updatedPayment.status}`);
      console.log(`   Completed At: ${updatedPayment.completed_at || 'N/A'}`);
      console.log(`   Verified At: ${updatedPayment.verified_at || 'N/A'}`);
      console.log(`   Payment Method: ${updatedPayment.payment_method || 'N/A'}`);
    }
    
    console.log('');
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testVerification()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
