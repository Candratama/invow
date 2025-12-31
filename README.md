# Invoice Generator App

A Next.js application for generating invoices with subscription-based limits and Mayar payment integration.

## Features

- Invoice generation with PDF export
- **Buyback Invoice Support**: Create invoices for buying back items calculated per gram
- Subscription tiers (Free: 30 invoices/month, Starter: 200 invoices/month)
- Mayar payment gateway integration
- Real-time subscription tracking
- Monthly usage limits enforcement
- 8 professional invoice templates
- Tax calculation support
- Customer management with status levels (Distributor, Reseller, Customer)

### Buyback Invoice Feature

The application supports creating buyback invoices for businesses that purchase items by weight (e.g., gold, precious metals).

**How to use:**
1. **Set Buyback Price**: Go to Settings > Invoice Settings and set your buyback price per gram
2. **Create Invoice**: When adding items, toggle "Buyback Invoice" mode
3. **Enter Weight**: Input the weight in grams instead of quantity
4. **Automatic Calculation**: Total is automatically calculated as `gram × buyback_rate`
5. **Export**: Download as JPEG with proper buyback item display

**Features:**
- Separate buyback price configuration in settings
- Toggle between regular and buyback modes
- Real-time calculation preview
- Prevents mixing buyback and regular items in same invoice
- All 8 templates support buyback item display
- Database schema supports both invoice types

**Technical Details:**
- Buyback items stored with `is_buyback: true`, `gram`, `buyback_rate`, `total` fields
- Regular items use `quantity`, `price`, `subtotal` fields
- Check constraints ensure data integrity
- Backward compatible with existing invoices

## Environment Variables

This application requires the following environment variables to be configured in `.env.local`:

### Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
```

**How to get these values:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings > API
4. Copy the Project URL and anon/service_role keys

### Mayar Payment Gateway Configuration

```env
MAYAR_API_KEY=your_mayar_api_key
MAYAR_API_URL=https://api.mayar.id/ks/v1
```

**How to get these values:**
1. Sign up for a [Mayar account](https://mayar.id)
2. Navigate to Developer Settings in your Mayar dashboard
3. Generate an API key
4. Use the production API URL: `https://api.mayar.id/ks/v1` (or sandbox URL for testing)

**Important Notes:**
- `MAYAR_API_KEY`: Used to authenticate API requests to Mayar for creating invoices and verifying payments
- `MAYAR_API_URL`: The base URL for Mayar API endpoints (production or sandbox)

### Application Configuration

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Configuration Details:**
- `NEXT_PUBLIC_APP_URL`: The base URL of your application (required for payment redirect flow)
  - Development: `http://localhost:3000`
  - Production: Your deployed application URL (e.g., `https://yourdomain.com`)
  - **Important**: Must use HTTPS in production for security
  - Used to construct redirect URLs after payment completion
- `NODE_ENV`: Environment mode (`development`, `production`, or `test`)

### Environment Variable Setup

1. Copy the `.env.example` file to `.env.local` in the root directory
2. Add all required environment variables with your actual values
3. Never commit `.env.local` to version control (it's already in `.gitignore`)
4. For production deployment, configure these variables in your hosting platform's environment settings

**Environment Validation:**
The application automatically validates all required environment variables at startup. If any required variables are missing or misconfigured, you'll see clear error messages in the console. In production, the application will refuse to start if required variables are missing.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Subscription Tiers

- **Free Tier**: 30 invoices per month (default for new users)
- **Starter Tier**: 200 invoices per month (Rp 15,000/month)
- **Pro Tier**: Unlimited invoices (Rp 50,000/month)

### Updating Prices

To update subscription prices, edit: `lib/config/pricing.ts`

## Payment Integration

The app uses Mayar payment gateway for processing subscription upgrades with a **redirect-based verification flow**. This approach provides immediate user feedback and simplifies the payment infrastructure by eliminating the need for webhook relay services.

### Payment Flow Overview

The payment flow follows these steps:

1. **User Initiates Upgrade**: User clicks "Upgrade" button on the pricing page
2. **Invoice Creation**: System calls `/api/payments/create-invoice` to create a Mayar invoice with:
   - Subscription tier details (amount, duration, description)
   - Redirect URL pointing back to the application
   - User information (name, email, mobile)
3. **Redirect to Mayar**: User is redirected to Mayar's secure payment page
4. **Payment Completion**: User completes payment through Mayar using their preferred payment method
5. **Redirect Back**: Mayar redirects user back to: `/dashboard?payment_redirect=true&invoice_id=xxx`
6. **Loading State**: Application displays "Verifying payment..." loading indicator
7. **Payment Verification**: Frontend calls `/api/payments/verify` with the invoice ID
8. **Server-Side Verification**: Backend verifies payment status with Mayar API:
   - Queries Mayar API for transaction details
   - Validates payment status is "paid"
   - Checks for duplicate processing (idempotency)
9. **Subscription Update**: System updates user subscription in database:
   - Updates subscription tier and expiry date
   - Marks payment as completed
   - Stores transaction ID and payment method
10. **Success Notification**: User sees success message with subscription details
11. **UI Update**: Dashboard immediately reflects new subscription tier and limits

### Redirect URL Configuration

The redirect URL is automatically constructed using the `NEXT_PUBLIC_APP_URL` environment variable:

```typescript
// Example redirect URL format
https://yourdomain.com/dashboard?payment_redirect=true&invoice_id=abc-123-def
```

**Configuration Requirements:**

1. **Development Environment**:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   - Use `http://localhost:3000` for local testing
   - Mayar sandbox supports HTTP for development

2. **Production Environment**:
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
   - **Must use HTTPS** (required for security)
   - Domain must be publicly accessible
   - No trailing slash in the URL

3. **Staging Environment**:
   ```env
   NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
   ```
   - Use your staging domain URL
   - HTTPS is recommended even for staging

**Important Notes:**
- The redirect URL is included in the Mayar invoice payload during creation
- Mayar redirects users to this URL after successful payment
- URL parameters `payment_redirect=true` and `invoice_id` are automatically appended
- The application detects these parameters to trigger verification

### Payment Verification Process

The verification process ensures payment authenticity and prevents fraud:

#### Client-Side Detection (PaymentSuccessHandler Component)

```typescript
// Located in: components/features/payment/success-handler.tsx

// 1. Detect redirect from Mayar
const paymentRedirect = searchParams.get("payment_redirect");
const invoiceId = searchParams.get("invoice_id");

if (paymentRedirect === "true" && invoiceId) {
  // 2. Show loading state
  setVerifying(true);
  
  // 3. Call verification API
  await verifyPayment(invoiceId);
}
```

#### Server-Side Verification (API Endpoint)

```typescript
// Located in: app/api/payments/verify/route.ts

POST /api/payments/verify
Content-Type: application/json

Request Body:
{
  "invoiceId": "abc-123-def"
}

// Verification steps:
// 1. Authenticate user session
// 2. Find payment record in database
// 3. Check if already processed (idempotency)
// 4. Query Mayar API for transaction details
// 5. Validate payment status is "paid"
// 6. Update payment record with transaction ID
// 7. Upgrade user subscription
// 8. Return success response
```

#### Verification Service (MayarPaymentService)

```typescript
// Located in: lib/db/services/mayar-payment.service.ts

async verifyAndProcessPayment(userId: string, invoiceId: string) {
  // 1. Find pending payment
  const payment = await findPaymentByInvoiceId(invoiceId, userId);
  
  // 2. Check if already processed (prevents duplicate processing)
  if (payment.status === 'completed') {
    return currentSubscription;
  }
  
  // 3. Query Mayar API using MCP wrapper
  const transactions = await getMayarTransactions(invoiceId);
  
  // 4. Validate payment status
  if (transaction.status !== 'paid') {
    throw new Error('Payment not completed');
  }
  
  // 5. Update payment record
  await updatePaymentRecord(payment.id, {
    status: 'completed',
    mayar_transaction_id: transaction.id,
    payment_method: transaction.paymentMethod,
    verified_at: new Date()
  });
  
  // 6. Upgrade subscription
  await subscriptionService.upgradeSubscription(userId, payment.tier);
  
  return { success: true, subscription };
}
```

### Security Features

1. **Authentication Required**: All payment endpoints require valid user session
2. **User Ownership Validation**: Users can only verify their own payments
3. **Server-Side Verification**: Payment status is verified with Mayar API, not trusted from client
4. **Idempotency**: Duplicate verification requests are handled gracefully
5. **HTTPS Enforcement**: Production redirects require HTTPS protocol
6. **No Sensitive Data Exposure**: Payment details are sanitized before logging
7. **Rate Limiting**: Verification endpoint has rate limiting to prevent abuse
8. **Input Validation**: All inputs are validated before processing

### Payment Flow Requirements

- `NEXT_PUBLIC_APP_URL` must be configured correctly for redirect to work
- Application must be accessible from the internet in production
- HTTPS is required in production for security
- Mayar API credentials must be valid and active
- Database must be accessible for payment record updates

### Testing the Payment Flow

#### Development Testing (Mayar Sandbox)

1. Ensure environment variables are set:
   ```bash
   MAYAR_API_KEY=your_sandbox_api_key
   MAYAR_API_URL=https://api.mayar.id/ks/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to the pricing page and click "Upgrade"

4. Complete payment in Mayar sandbox (use test payment methods)

5. Verify you're redirected back to the dashboard

6. Check that:
   - Loading indicator appears
   - Success notification is displayed
   - Subscription tier is updated
   - Invoice limits reflect new tier

#### Production Testing

1. Use Mayar production API credentials
2. Ensure `NEXT_PUBLIC_APP_URL` uses HTTPS
3. Test with real payment methods (small amounts recommended)
4. Monitor logs for any errors during verification

### Troubleshooting

#### Issue: User not redirected back after payment

**Symptoms:**
- User completes payment at Mayar but stays on Mayar's page
- No redirect back to the application

**Possible Causes:**
1. `NEXT_PUBLIC_APP_URL` is not configured or incorrect
2. Redirect URL was not included in invoice creation
3. Application is not accessible from the internet

**Solutions:**
1. Verify `NEXT_PUBLIC_APP_URL` in `.env.local`:
   ```bash
   # Check the value
   echo $NEXT_PUBLIC_APP_URL
   ```

2. Check invoice creation logs for redirect URL:
   ```bash
   # Look for log entries like:
   # "Creating Mayar invoice with redirectUrl: https://..."
   ```

3. Ensure application is publicly accessible (for production):
   ```bash
   # Test from external network
   curl https://yourdomain.com/dashboard
   ```

4. Restart the application after changing environment variables:
   ```bash
   npm run dev  # Development
   # or restart production server
   ```

#### Issue: "Payment not found" error during verification

**Symptoms:**
- User is redirected back but sees "Payment not found" error
- Verification fails with 404 or "not found" message

**Possible Causes:**
1. Invoice ID in URL doesn't match database record
2. Payment record was not created during invoice creation
3. User is trying to verify someone else's payment

**Solutions:**
1. Check database for payment record:
   ```sql
   SELECT * FROM payment_transactions 
   WHERE mayar_invoice_id = 'invoice-id-from-url';
   ```

2. Verify invoice was created successfully:
   - Check application logs for invoice creation
   - Look for Mayar API response with invoice ID

3. Ensure user is authenticated:
   - Check browser console for authentication errors
   - Verify user session is valid

4. Check for typos in invoice ID:
   - Compare URL parameter with database record
   - Ensure no extra characters or spaces

#### Issue: "Payment status is not paid" error

**Symptoms:**
- Verification fails with message about payment status
- User completed payment but system says it's not paid

**Possible Causes:**
1. Payment is still processing at Mayar
2. Payment failed but user was still redirected
3. Mayar API is returning stale data

**Solutions:**
1. Wait a few moments and refresh the page:
   - Payment processing can take 10-30 seconds
   - Mayar API may have slight delays

2. Check payment status in Mayar dashboard:
   - Log into Mayar merchant dashboard
   - Find the transaction by invoice ID
   - Verify status is "paid"

3. Manually verify transaction using script:
   ```bash
   node scripts/check-payment-status.js
   # Edit TRANSACTION_ID in script first
   ```

4. If payment is confirmed in Mayar but still failing:
   - Check Mayar API credentials are correct
   - Verify API endpoint URL is correct
   - Check for API rate limiting or errors

#### Issue: Verification takes too long or times out

**Symptoms:**
- Loading indicator shows for more than 10 seconds
- Request times out with network error
- User sees "Unable to verify payment" message

**Possible Causes:**
1. Mayar API is slow or unresponsive
2. Network connectivity issues
3. Database query is slow
4. Server is overloaded

**Solutions:**
1. Check Mayar API status:
   - Visit Mayar status page or contact support
   - Test API directly with curl:
     ```bash
     curl -H "Authorization: Bearer $MAYAR_API_KEY" \
          https://api.mayar.id/ks/v1/transactions
     ```

2. Check server logs for errors:
   ```bash
   # Look for timeout errors or slow queries
   tail -f logs/application.log
   ```

3. Verify database performance:
   ```sql
   -- Check for slow queries
   EXPLAIN ANALYZE 
   SELECT * FROM payment_transactions 
   WHERE mayar_invoice_id = 'invoice-id';
   ```

4. Retry verification:
   - Refresh the page to trigger verification again
   - System has built-in retry logic (2 attempts)

#### Issue: Subscription not updated after successful verification

**Symptoms:**
- Verification succeeds with success message
- But subscription tier doesn't change
- Invoice limits remain at old tier

**Possible Causes:**
1. Database update failed after verification
2. Subscription service error
3. Cache not invalidated
4. UI not refreshing

**Solutions:**
1. Check database for subscription update:
   ```sql
   SELECT * FROM subscriptions 
   WHERE user_id = 'user-id' 
   ORDER BY updated_at DESC;
   ```

2. Check application logs for subscription update errors:
   ```bash
   # Look for errors in subscription service
   grep "subscription" logs/application.log
   ```

3. Clear browser cache and refresh:
   ```bash
   # Hard refresh in browser
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

4. Manually update subscription if needed:
   ```sql
   UPDATE subscriptions 
   SET tier = 'pro', 
       expires_at = NOW() + INTERVAL '30 days',
       updated_at = NOW()
   WHERE user_id = 'user-id';
   ```

#### Issue: "Already processed" message but subscription not upgraded

**Symptoms:**
- Verification returns "already processed" message
- But user's subscription is still on old tier
- Payment record shows completed status

**Possible Causes:**
1. Payment was verified but subscription update failed
2. Database transaction was partially committed
3. Race condition during processing

**Solutions:**
1. Check payment record status:
   ```sql
   SELECT * FROM payment_transactions 
   WHERE mayar_invoice_id = 'invoice-id';
   ```

2. Check subscription record:
   ```sql
   SELECT * FROM subscriptions 
   WHERE user_id = 'user-id';
   ```

3. If payment is completed but subscription not updated:
   ```bash
   # Use manual processing script
   node scripts/manual-process-webhook.js
   # Edit TRANSACTION_ID in script first
   ```

4. Contact support with:
   - Invoice ID
   - User ID
   - Payment record ID
   - Timestamp of payment

#### Issue: HTTPS required error in production

**Symptoms:**
- Redirect URL uses HTTP instead of HTTPS
- Browser shows security warning
- Payment fails with protocol error

**Possible Causes:**
1. `NEXT_PUBLIC_APP_URL` configured with HTTP
2. Reverse proxy not configured for HTTPS
3. SSL certificate issues

**Solutions:**
1. Update environment variable to use HTTPS:
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. Verify SSL certificate is valid:
   ```bash
   curl -I https://yourdomain.com
   ```

3. Check reverse proxy configuration (nginx/apache):
   ```nginx
   # Ensure HTTPS is properly configured
   server {
     listen 443 ssl;
     ssl_certificate /path/to/cert.pem;
     ssl_certificate_key /path/to/key.pem;
   }
   ```

4. Restart application after configuration changes

#### Issue: Multiple verification requests

**Symptoms:**
- User sees multiple loading indicators
- Multiple API calls to verification endpoint
- Duplicate processing attempts

**Possible Causes:**
1. User refreshing page multiple times
2. Component re-rendering triggering multiple calls
3. Browser back/forward navigation

**Solutions:**
1. System has built-in idempotency protection:
   - Duplicate requests return cached result
   - No duplicate subscription updates

2. If experiencing issues:
   - Clear browser cache
   - Close and reopen browser tab
   - Check for JavaScript errors in console

3. For developers:
   - Ensure useEffect dependencies are correct
   - Add request deduplication in frontend
   - Check for race conditions

### Getting Help

If you encounter issues not covered in this troubleshooting guide:

1. **Check Application Logs**: Look for detailed error messages and stack traces
2. **Check Mayar Dashboard**: Verify payment status in Mayar merchant portal
3. **Check Database**: Query payment and subscription tables for data consistency
4. **Contact Mayar Support**: For issues related to Mayar API or payment processing
5. **Review Code**: Check recent changes that might have affected payment flow

### Monitoring and Maintenance

**Key Metrics to Monitor:**
- Verification success rate (should be >95%)
- Average verification time (should be <3 seconds)
- Failed verification count and reasons
- Mayar API response times

**Regular Maintenance:**
- Review payment logs weekly for errors
- Monitor Mayar API status and updates
- Keep Mayar API credentials secure and rotated
- Test payment flow after any code changes
- Backup payment and subscription data regularly

## Security

- Payment verification is performed server-side using Mayar API
- API endpoints require user authentication
- Environment variables are never exposed to the client
- Supabase Row Level Security (RLS) policies protect user data
- HTTPS is enforced in production for secure payment redirects

## Utility Scripts

For maintenance and debugging:

- `scripts/check-payment-status.js` - Check payment status in Mayar
- `scripts/manual-process-webhook.js` - Manually process stuck payments (legacy, for migration period)

**Usage:**
1. Edit the script file and set the `TRANSACTION_ID` or `INVOICE_ID` variable
2. Run the script:
   ```bash
   node scripts/check-payment-status.js
   ```

**Note:** These scripts are primarily for debugging and should not be needed in normal operation with the redirect-based flow.

## Architecture Notes

### Payment Flow Architecture

The application uses a **redirect-based payment verification flow** instead of webhooks:

**Why Redirect Instead of Webhooks?**
- Simpler infrastructure (no webhook relay needed)
- Immediate user feedback (user sees result right away)
- Easier to debug and test
- No webhook URL configuration required
- Works perfectly for single-app deployments

**How It Works:**
1. Invoice creation includes a redirect URL
2. Mayar redirects user back after payment
3. Application detects redirect and verifies with Mayar API
4. Server-side verification ensures security
5. Subscription is updated immediately

**Security Considerations:**
- Never trust client-side data without verification
- Always verify payment status with Mayar API
- Use HTTPS in production for secure redirects
- Implement idempotency to prevent duplicate processing
- Validate user ownership of payments

## Database Schema

### Payment Transactions Table

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  mayar_invoice_id TEXT NOT NULL,
  mayar_transaction_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_mayar_invoice_id ON payment_transactions(mayar_invoice_id);
CREATE INDEX idx_payment_transactions_mayar_transaction_id ON payment_transactions(mayar_transaction_id);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'pro')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
```

## Security

- Never commit `.env.local` to repository
- All scripts use environment variables
- No hardcoded credentials in code
- Payment verification is performed server-side
- API endpoints require user authentication
- Supabase Row Level Security (RLS) policies protect user data
- HTTPS is enforced in production for secure payment redirects
- Sensitive data is sanitized before logging
