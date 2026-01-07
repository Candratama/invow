# Subscription Expiry Reminder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Send email reminders (H-7, H-3, H-1) and show in-app banner for expiring premium subscriptions.

**Architecture:** pg_cron triggers daily Edge Function to query expiring users and send emails via Supabase SMTP (Brevo). React component shows warning banner on dashboard for users with <= 7 days until expiry.

**Tech Stack:** Supabase (pg_cron, Edge Functions, PostgreSQL), Next.js, React, TypeScript

---

## Task 1: Create SQL Function for Expiring Subscriptions

**Files:**
- Create: `supabase/migrations/20260107000000_add_expiry_reminder_function.sql`

**Step 1: Create migration file with SQL function**

```sql
-- Migration: Add function to get expiring subscriptions
-- This function returns premium users whose subscription expires in 7, 3, or 1 days

CREATE OR REPLACE FUNCTION public.get_expiring_subscriptions()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  tier TEXT,
  end_date TIMESTAMPTZ,
  days_until_expiry INT,
  remaining_credits INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.user_id,
    au.email::TEXT,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User')::TEXT as full_name,
    us.tier::TEXT,
    us.subscription_end_date as end_date,
    DATE_PART('day', us.subscription_end_date::timestamp - NOW()::timestamp)::INT as days_until_expiry,
    GREATEST(0, us.invoice_limit - us.current_month_count)::INT as remaining_credits
  FROM user_subscriptions us
  JOIN auth.users au ON us.user_id = au.id
  WHERE
    us.tier = 'premium'
    AND us.subscription_end_date IS NOT NULL
    AND DATE_PART('day', us.subscription_end_date::timestamp - NOW()::timestamp) IN (7, 3, 1);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_expiring_subscriptions() TO service_role;
```

**Step 2: Apply migration to Supabase**

Run: `npx supabase db push`

Expected: Migration applied successfully

**Step 3: Test the function in Supabase SQL Editor**

Run this query in Supabase Dashboard > SQL Editor:
```sql
SELECT * FROM get_expiring_subscriptions();
```

Expected: Returns empty table or users with matching criteria (no errors)

**Step 4: Commit**

```bash
git add supabase/migrations/20260107000000_add_expiry_reminder_function.sql
git commit -m "feat(db): add get_expiring_subscriptions function"
```

---

## Task 2: Create Edge Function for Sending Emails

**Files:**
- Create: `supabase/functions/send-renewal-email/index.ts`

**Step 1: Create Edge Function directory and file**

```typescript
// supabase/functions/send-renewal-email/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpiringUser {
  user_id: string
  email: string
  full_name: string
  tier: string
  end_date: string
  days_until_expiry: number
  remaining_credits: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!authHeader || !authHeader.includes(serviceRoleKey!)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get expiring subscriptions
    const { data: users, error } = await supabase.rpc('get_expiring_subscriptions')

    if (error) {
      console.error('Error fetching expiring users:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expiringUsers = users as ExpiringUser[]
    let sentCount = 0
    const errors: string[] = []

    // Send email to each user
    for (const user of expiringUsers || []) {
      try {
        const subject = getSubject(user.days_until_expiry)
        const html = getEmailTemplate(user)

        const { error: emailError } = await supabase.auth.admin.sendRawEmail({
          to: user.email,
          subject,
          html,
        })

        if (emailError) {
          console.error(`Failed to send to ${user.email}:`, emailError)
          errors.push(`${user.email}: ${emailError.message}`)
        } else {
          sentCount++
          console.log(`Email sent to ${user.email} (H-${user.days_until_expiry})`)
        }
      } catch (err) {
        console.error(`Error sending to ${user.email}:`, err)
        errors.push(`${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: expiringUsers?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getSubject(days: number): string {
  if (days === 7) return 'Subscription Anda akan berakhir dalam 7 hari'
  if (days === 3) return 'Subscription Anda akan berakhir dalam 3 hari'
  return 'Subscription Anda akan berakhir besok!'
}

function getEmailTemplate(user: ExpiringUser): string {
  const urgencyColor = user.days_until_expiry <= 1 ? '#DC2626' :
                       user.days_until_expiry <= 3 ? '#D97706' : '#2563EB'

  const formattedDate = new Date(user.end_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const headerEmoji = user.days_until_expiry <= 1 ? '⚠️ Subscription Berakhir Besok!' :
                      user.days_until_expiry <= 3 ? '⏰ Subscription Segera Berakhir' :
                      '📅 Pengingat Subscription'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: ${urgencyColor}; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">
        ${headerEmoji}
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">
        Halo <strong>${user.full_name}</strong>,
      </p>

      <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
        Subscription Premium Anda akan berakhir pada:
      </p>

      <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 20px; font-weight: bold; color: #111827; margin: 0;">
          ${formattedDate}
        </p>
        <p style="font-size: 14px; color: #6B7280; margin: 8px 0 0;">
          (${user.days_until_expiry} hari lagi)
        </p>
      </div>

      ${user.remaining_credits > 0 ? `
      <p style="font-size: 14px; color: #6B7280; margin: 0 0 24px;">
        Anda masih memiliki <strong>${user.remaining_credits} invoice credits</strong> yang akan hangus jika tidak diperpanjang.
      </p>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://invow.app/dashboard/settings"
           style="display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Perpanjang Sekarang
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 16px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
        Email ini dikirim otomatis oleh Invow. Jika ada pertanyaan, hubungi support kami.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()
}
```

**Step 2: Deploy Edge Function**

Run: `npx supabase functions deploy send-renewal-email`

Expected: Function deployed successfully

**Step 3: Test Edge Function manually**

Run in terminal (replace with your project URL and service role key):
```bash
curl -X POST 'https://<project>.supabase.co/functions/v1/send-renewal-email' \
  -H 'Authorization: Bearer <service_role_key>' \
  -H 'Content-Type: application/json'
```

Expected: `{"success":true,"sent":0,"total":0}` (or actual count if matching users exist)

**Step 4: Commit**

```bash
git add supabase/functions/send-renewal-email/index.ts
git commit -m "feat(edge): add send-renewal-email function"
```

---

## Task 3: Setup pg_cron Schedule

**Files:**
- Create: `supabase/migrations/20260107000001_add_renewal_reminder_cron.sql`

**Step 1: Create migration for pg_cron**

```sql
-- Migration: Setup pg_cron to trigger renewal email daily at 09:00 WIB (02:00 UTC)
-- Requires pg_cron and pg_net extensions

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cron job
-- Runs daily at 02:00 UTC (09:00 WIB)
SELECT cron.schedule(
  'send-renewal-reminders',           -- job name
  '0 2 * * *',                         -- cron expression: 02:00 UTC daily
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-renewal-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Step 2: Note about pg_cron setup**

pg_cron requires configuration in Supabase Dashboard:
1. Go to Database > Extensions
2. Enable `pg_cron` extension
3. Enable `pg_net` extension (for HTTP calls)
4. Set app.settings in Database > Settings (or use Vault for secrets)

Alternative: Use Supabase Dashboard to create the cron job manually via SQL Editor if migration fails.

**Step 3: Commit**

```bash
git add supabase/migrations/20260107000001_add_renewal_reminder_cron.sql
git commit -m "feat(db): add pg_cron schedule for renewal reminders"
```

---

## Task 4: Extend usePremiumStatus Hook

**Files:**
- Modify: `lib/hooks/use-premium-status.ts`

**Step 1: Read current implementation**

First, read the current file to understand existing structure.

**Step 2: Add expiry fields to the hook**

Update the hook to include:
- `expiresAt: Date | null`
- `daysUntilExpiry: number | null`
- `isExpiringSoon: boolean`

The hook should fetch subscription end date from `getSubscriptionStatusAction` and calculate days until expiry.

**Step 3: Verify build passes**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add lib/hooks/use-premium-status.ts
git commit -m "feat(hook): add expiry fields to usePremiumStatus"
```

---

## Task 5: Create ExpiryBanner Component

**Files:**
- Create: `components/features/subscription/expiry-banner.tsx`

**Step 1: Create the banner component**

```tsx
'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UpgradeModal from '@/components/features/subscription/upgrade-modal'

interface ExpiryBannerProps {
  daysUntilExpiry: number | null
}

export function ExpiryBanner({ daysUntilExpiry }: ExpiryBannerProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  // Don't render if no expiry or more than 7 days
  if (daysUntilExpiry === null || daysUntilExpiry > 7) return null

  // Determine urgency level
  const urgency: 'urgent' | 'warning' | 'info' =
    daysUntilExpiry <= 1 ? 'urgent' :
    daysUntilExpiry <= 3 ? 'warning' : 'info'

  const colors = {
    urgent: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const buttonColors = {
    urgent: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  }

  const message =
    daysUntilExpiry <= 1
      ? 'Subscription Anda berakhir besok!'
      : `Subscription berakhir dalam ${daysUntilExpiry} hari`

  return (
    <>
      <div className={`p-3 border rounded-lg ${colors[urgency]} mb-4`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
          </div>
          <Button
            size="sm"
            className={buttonColors[urgency]}
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            Perpanjang Sekarang
          </Button>
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="Premium Subscription"
        featureDescription="Perpanjang subscription untuk terus menikmati fitur premium."
      />
    </>
  )
}
```

**Step 2: Verify component compiles**

Run: `npm run build`

Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/features/subscription/expiry-banner.tsx
git commit -m "feat(ui): add ExpiryBanner component"
```

---

## Task 6: Integrate Banner into Dashboard

**Files:**
- Modify: `app/dashboard/dashboard-client.tsx`

**Step 1: Read current dashboard-client.tsx**

Understand where to place the banner (should be at top of main content area).

**Step 2: Add ExpiryBanner import and usage**

Add at top of file:
```tsx
import { ExpiryBanner } from '@/components/features/subscription/expiry-banner'
```

Modify usePremiumStatus usage to get new fields:
```tsx
const { isPremium, daysUntilExpiry } = usePremiumStatus()
```

Add banner in the JSX (after header, before main content):
```tsx
{isPremium && <ExpiryBanner daysUntilExpiry={daysUntilExpiry} />}
```

**Step 3: Verify build passes**

Run: `npm run build`

Expected: Build succeeds

**Step 4: Test manually in browser**

1. Start dev server: `npm run dev`
2. Login as premium user
3. Verify banner does NOT show (unless subscription is expiring soon)
4. Optionally: Temporarily modify `daysUntilExpiry > 7` check to test banner rendering

**Step 5: Commit**

```bash
git add app/dashboard/dashboard-client.tsx
git commit -m "feat(dashboard): integrate ExpiryBanner for premium users"
```

---

## Task 7: Final Testing & Cleanup

**Step 1: Run full build**

Run: `npm run build`

Expected: Build succeeds with no errors

**Step 2: Test email function in Supabase**

In Supabase SQL Editor, temporarily insert a test subscription expiring in 7 days, then trigger the Edge Function manually to verify email is sent.

**Step 3: Verify pg_cron is scheduled**

In Supabase SQL Editor:
```sql
SELECT * FROM cron.job;
```

Expected: See `send-renewal-reminders` job scheduled for `0 2 * * *`

**Step 4: Create final commit**

```bash
git add -A
git commit -m "feat: complete subscription expiry reminder system

- SQL function to get expiring subscriptions (H-7, H-3, H-1)
- Edge Function to send reminder emails via Supabase SMTP
- pg_cron schedule for daily 09:00 WIB trigger
- ExpiryBanner component with urgency levels
- Dashboard integration for premium users"
```

---

## Summary

| Task | Description | Commit Message |
|------|-------------|----------------|
| 1 | SQL function `get_expiring_subscriptions` | `feat(db): add get_expiring_subscriptions function` |
| 2 | Edge Function `send-renewal-email` | `feat(edge): add send-renewal-email function` |
| 3 | pg_cron schedule | `feat(db): add pg_cron schedule for renewal reminders` |
| 4 | Extend `usePremiumStatus` hook | `feat(hook): add expiry fields to usePremiumStatus` |
| 5 | Create `ExpiryBanner` component | `feat(ui): add ExpiryBanner component` |
| 6 | Integrate into dashboard | `feat(dashboard): integrate ExpiryBanner for premium users` |
| 7 | Final testing | Final commit with summary |
