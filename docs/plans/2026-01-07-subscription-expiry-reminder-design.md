# Subscription Expiry Reminder Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Notify premium users before their subscription expires via email and in-app banner.

**Architecture:** pg_cron triggers daily Edge Function to send emails; React component shows banner on dashboard.

**Tech Stack:** Supabase (pg_cron, Edge Functions, SMTP/Brevo), Next.js, React

---

## 1. Overview

### Problem
Premium users tidak mendapat notifikasi saat subscription akan expired. Hanya admin yang bisa melihat status `expiring_soon` di admin panel.

### Solution
1. **Email reminder** - Kirim H-7, H-3, H-1 sebelum expired
2. **In-app banner** - Tampil di dashboard jika <= 7 hari

### Schedule
- Email dikirim setiap hari jam **09:00 WIB** (02:00 UTC)
- Reminder untuk: **H-7, H-3, H-1**

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCHEDULED EMAIL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  pg_cron (daily 09:00 WIB)                                      │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │ SQL Function        │───▶│ Supabase Edge       │             │
│  │ get_expiring_subs   │    │ Function            │             │
│  │ (H-7, H-3, H-1)     │    │ send-renewal-email  │             │
│  └─────────────────────┘    └──────────┬──────────┘             │
│                                        │                         │
│                                        ▼                         │
│                             ┌─────────────────────┐             │
│                             │ Supabase SMTP       │             │
│                             │ (Brevo)             │             │
│                             └──────────┬──────────┘             │
│                                        │                         │
│                                        ▼                         │
│                                   📧 User                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        IN-APP BANNER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard Page Load                                             │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────┐                                        │
│  │ usePremiumStatus()  │ ◄── existing hook + new fields         │
│  │ + expiresAt         │                                        │
│  │ + daysUntilExpiry   │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────┐                                        │
│  │ <ExpiryBanner />    │  ← tampil jika <= 7 hari               │
│  │ - Warning style     │                                        │
│  │ - Renew CTA         │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Changes

### SQL Function: `get_expiring_subscriptions`

```sql
CREATE OR REPLACE FUNCTION get_expiring_subscriptions()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  tier TEXT,
  end_date TIMESTAMPTZ,
  days_until_expiry INT,
  remaining_credits INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
    us.tier,
    us.subscription_end_date as end_date,
    EXTRACT(DAY FROM us.subscription_end_date - NOW())::INT as days_until_expiry,
    (us.invoice_limit - us.current_month_count) as remaining_credits
  FROM user_subscriptions us
  JOIN auth.users au ON us.user_id = au.id
  WHERE
    us.tier = 'premium'
    AND us.subscription_end_date IS NOT NULL
    AND EXTRACT(DAY FROM us.subscription_end_date - NOW()) IN (7, 3, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### pg_cron Schedule

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 09:00 WIB (02:00 UTC)
SELECT cron.schedule(
  'send-renewal-reminders',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/send-renewal-email',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  )$$
);
```

---

## 4. Edge Function

### File: `supabase/functions/send-renewal-email/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // Verify request is from pg_cron (internal)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get expiring subscriptions
  const { data: users, error } = await supabase.rpc('get_expiring_subscriptions')

  if (error) {
    console.error('Error fetching users:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sentCount = 0

  // Send email to each user
  for (const user of users || []) {
    try {
      const subject = getSubject(user.days_until_expiry)
      const html = getEmailTemplate(user)

      await supabase.auth.admin.sendRawEmail({
        to: user.email,
        subject,
        html,
      })
      sentCount++
    } catch (err) {
      console.error(`Failed to send email to ${user.email}:`, err)
    }
  }

  return new Response(JSON.stringify({ sent: sentCount, total: users?.length || 0 }))
})

function getSubject(days: number): string {
  if (days === 7) return 'Subscription Anda akan berakhir dalam 7 hari'
  if (days === 3) return 'Subscription Anda akan berakhir dalam 3 hari'
  return 'Subscription Anda akan berakhir besok!'
}

function getEmailTemplate(user: {
  full_name: string
  days_until_expiry: number
  end_date: string
  remaining_credits: number
}): string {
  const urgencyColor = user.days_until_expiry <= 1 ? '#DC2626' :
                       user.days_until_expiry <= 3 ? '#D97706' : '#2563EB'

  const formattedDate = new Date(user.end_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

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
            ${user.days_until_expiry <= 1 ? '⚠️ Subscription Berakhir Besok!' :
              user.days_until_expiry <= 3 ? '⏰ Subscription Segera Berakhir' :
              '📅 Pengingat Subscription'}
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
  `
}
```

---

## 5. Frontend Changes

### Modified: `lib/hooks/use-premium-status.ts`

Add new fields to the hook return value:

```typescript
interface PremiumStatus {
  isPremium: boolean
  isLoading: boolean
  // New fields:
  expiresAt: Date | null
  daysUntilExpiry: number | null
  isExpiringSoon: boolean  // true if <= 7 days
}
```

### New: `components/features/subscription/expiry-banner.tsx`

```tsx
'use client'

import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import UpgradeModal from './upgrade-modal'

interface ExpiryBannerProps {
  daysUntilExpiry: number | null
  expiresAt: Date | null
}

export function ExpiryBanner({ daysUntilExpiry, expiresAt }: ExpiryBannerProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  if (daysUntilExpiry === null || daysUntilExpiry > 7) return null

  const urgency = daysUntilExpiry <= 1 ? 'urgent' :
                  daysUntilExpiry <= 3 ? 'warning' : 'info'

  const colors = {
    urgent: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const buttonColors = {
    urgent: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }

  const message = daysUntilExpiry <= 1
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
            className={`${buttonColors[urgency]} text-white`}
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

### Modified: `app/dashboard/dashboard-client.tsx`

Add ExpiryBanner at the top of dashboard content:

```tsx
import { ExpiryBanner } from '@/components/features/subscription/expiry-banner'

export function DashboardClient() {
  const { isPremium, daysUntilExpiry, expiresAt } = usePremiumStatus()

  return (
    <div>
      {/* Expiry Banner - only for premium users */}
      {isPremium && (
        <ExpiryBanner
          daysUntilExpiry={daysUntilExpiry}
          expiresAt={expiresAt}
        />
      )}

      {/* Rest of dashboard content */}
    </div>
  )
}
```

---

## 6. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_add_expiry_reminder.sql` | CREATE | SQL function + pg_cron schedule |
| `supabase/functions/send-renewal-email/index.ts` | CREATE | Edge Function to send emails |
| `lib/hooks/use-premium-status.ts` | MODIFY | Add expiresAt, daysUntilExpiry, isExpiringSoon |
| `components/features/subscription/expiry-banner.tsx` | CREATE | Banner component |
| `app/dashboard/dashboard-client.tsx` | MODIFY | Add ExpiryBanner |

---

## 7. Testing Checklist

- [ ] SQL function returns correct users for H-7, H-3, H-1
- [ ] Edge Function sends emails successfully
- [ ] pg_cron triggers at correct time (09:00 WIB)
- [ ] Email renders correctly in email clients
- [ ] Banner shows with correct urgency colors
- [ ] Banner CTA opens upgrade modal
- [ ] Banner hidden for non-premium users
- [ ] Banner hidden when > 7 days until expiry

---

## 8. Future Considerations

- Track email sent to avoid duplicates (optional: add `last_reminder_sent` column)
- Add unsubscribe option for email reminders
- Send confirmation email after successful renewal
