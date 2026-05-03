# Domain Migration Email Blast

Untuk dikirim via Brevo Campaigns ke seluruh user invow.

## Subject (pilih satu)

- `Invow pindah ke invow.web.id — update bookmark Anda sebelum 20 Mei`
- `[PENTING] Domain Invow pindah — invow.kodesafari.tech akan berhenti 20 Mei 2026`

## Preview text (Brevo)
```
Domain lama berhenti aktif 20 Mei 2026. Bookmark domain baru sekarang.
```

## HTML Body

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Invow pindah domain</title>
</head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f7f7;color:#1f2937;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:32px 32px 16px 32px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;color:#111827;">Domain Invow Pindah ke <span style="color:#2563eb;">invow.web.id</span></h1>
              <p style="margin:0;font-size:14px;color:#6b7280;">Update bookmark Anda sebelum 20 Mei 2026</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;font-size:15px;">
              <p>Halo,</p>
              <p>Mulai sekarang, Invow dapat diakses melalui domain baru:</p>
              <p style="text-align:center;margin:24px 0;">
                <a href="https://invow.web.id" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Buka invow.web.id</a>
              </p>
              <p><strong>Yang berubah:</strong></p>
              <ul style="padding-left:20px;">
                <li>Alamat baru: <strong>https://invow.web.id</strong></li>
                <li>Alamat lama: <s>invow.kodesafari.tech</s> berhenti aktif <strong>20 Mei 2026</strong></li>
                <li>Akun, data, invoice, dan subscription Anda <strong>tidak berubah</strong> — login pakai email yang sama</li>
              </ul>
              <p><strong>Yang perlu Anda lakukan:</strong></p>
              <ol style="padding-left:20px;">
                <li>Buka <a href="https://invow.web.id" style="color:#2563eb;">invow.web.id</a></li>
                <li>Login dengan akun yang biasa Anda pakai</li>
                <li>Update bookmark / shortcut di browser ke alamat baru</li>
                <li>Update link Invow di kartu nama, social media, atau materi promosi yang Anda bagi ke pelanggan</li>
              </ol>
              <p style="margin-top:24px;padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
                <strong>Penting:</strong> Setelah 20 Mei 2026, alamat lama (invow.kodesafari.tech) tidak bisa diakses lagi. Bookmark dan link yang masih pakai alamat lama akan rusak.
              </p>
              <p>Pertanyaan? Balas email ini, kami akan bantu.</p>
              <p style="margin-top:32px;">Terima kasih,<br><strong>Tim Invow</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
              <p style="margin:0;">Email ini dikirim ke pengguna terdaftar Invow.<br>
              <a href="https://invow.web.id" style="color:#2563eb;">invow.web.id</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Plain Text Fallback

```
Domain Invow Pindah ke invow.web.id

Halo,

Mulai sekarang, Invow dapat diakses melalui domain baru: https://invow.web.id

YANG BERUBAH:
- Alamat baru: https://invow.web.id
- Alamat lama: invow.kodesafari.tech berhenti aktif 20 Mei 2026
- Akun, data, invoice, dan subscription Anda tidak berubah — login pakai email yang sama

YANG PERLU ANDA LAKUKAN:
1. Buka https://invow.web.id
2. Login dengan akun yang biasa Anda pakai
3. Update bookmark / shortcut di browser ke alamat baru
4. Update link Invow di kartu nama, social media, atau materi promosi

PENTING: Setelah 20 Mei 2026, alamat lama (invow.kodesafari.tech) tidak bisa diakses lagi.

Pertanyaan? Balas email ini, kami akan bantu.

Terima kasih,
Tim Invow
https://invow.web.id
```

## Cara Kirim via Brevo

1. Brevo Dashboard → **Campaigns** → **+ Create a campaign** → **Email**
2. **Settings**:
   - From name: `Invow`
   - From email: `noreply@invow.web.id`
   - Reply-to: email yang Anda monitor (biar user bisa balas)
   - Subject: gunakan salah satu di atas
   - Preview text: copy dari atas
3. **Recipients**:
   - Pilih list yang berisi seluruh user terdaftar
   - Atau export user dari Supabase → import sebagai list di Brevo
4. **Design**: pilih HTML editor → paste HTML body di atas
5. **Test**: kirim test ke email Anda sendiri dulu — verify rendering, klik tombol CTA, cek spam folder
6. **Schedule** atau **Send now**

## Export Email User dari Supabase

Kalau belum punya list user di Brevo:

```sql
-- Run di Supabase SQL Editor
SELECT email
FROM auth.users
WHERE email IS NOT NULL
  AND email_confirmed_at IS NOT NULL  -- hanya user terverifikasi
ORDER BY created_at DESC;
```

Klik **Export → CSV** → upload ke Brevo Contacts → bikin list baru.

## Timeline Kirim

| Tanggal | Action |
|---------|--------|
| Sekarang | Kirim email blast pertama |
| 7 hari sebelum sunset (~13 Mei 2026) | Reminder email kedua |
| 1 hari sebelum sunset (~19 Mei 2026) | Reminder final dengan urgency |
| 20 Mei 2026 | Domain lama mati |

## Tips

- **Warmup**: kirim batch kecil dulu (100-500 user) → monitor bounce / spam → kalau bersih, lanjut full blast
- **Pantau**: Brevo dashboard → cek open rate, click rate, bounce rate. Bounce >5% = list bermasalah
- **Track**: tambah UTM parameter di link CTA: `https://invow.web.id?utm_source=email&utm_campaign=domain_migration` → tracking di Google Analytics
