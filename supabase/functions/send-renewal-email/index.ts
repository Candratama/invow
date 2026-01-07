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
