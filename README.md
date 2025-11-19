# Invoice Generator App

A Next.js application for generating invoices with subscription-based limits and Mayar payment integration.

## Features

- Invoice generation with PDF export
- Subscription tiers (Free: 30 invoices/month, Starter: 200 invoices/month)
- Mayar payment gateway integration
- Real-time subscription tracking
- Monthly usage limits enforcement

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
MAYAR_WEBHOOK_SECRET=your_mayar_webhook_secret
MAYAR_API_URL=https://api.mayar.id/ks/v1
```

**How to get these values:**
1. Sign up for a [Mayar account](https://mayar.id)
2. Navigate to Developer Settings in your Mayar dashboard
3. Generate an API key
4. Copy the webhook secret from the webhook configuration section
5. Use the production API URL: `https://api.mayar.id/ks/v1` (or sandbox URL for testing)

**Important Notes:**
- `MAYAR_API_KEY`: Used to authenticate API requests to Mayar for creating invoices
- `MAYAR_WEBHOOK_SECRET`: Used to verify webhook signatures from Mayar for security
- `MAYAR_API_URL`: The base URL for Mayar API endpoints (production or sandbox)

### Environment Variable Setup

1. Copy the `.env.local.example` file (if available) or create a new `.env.local` file in the root directory
2. Add all required environment variables with your actual values
3. Never commit `.env.local` to version control (it's already in `.gitignore`)
4. For production deployment, configure these variables in your hosting platform's environment settings

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

The app uses Mayar payment gateway for processing subscription upgrades:

1. User clicks "Upgrade" button on pricing page
2. System creates a Mayar invoice with the subscription amount
3. User completes payment through Mayar's payment page
4. Mayar sends webhook notification to the app
5. System verifies webhook signature and updates user subscription
6. User's invoice limit is immediately increased

## Security

- All webhook requests from Mayar are verified using signature validation
- API endpoints require user authentication
- Environment variables are never exposed to the client
- Supabase Row Level Security (RLS) policies protect user data

## Utility Scripts

For maintenance and debugging:

- `scripts/check-payment-status.js` - Check payment status
- `scripts/manual-process-webhook.js` - Manually process stuck payments

Edit TRANSACTION_ID in scripts before running.

## Security

- Never commit `.env.local` to repository
- All scripts use environment variables
- No hardcoded credentials in code
