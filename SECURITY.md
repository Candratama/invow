# Security Guidelines

## Logging Security

### Safe Logger Utility

All payment-related logging uses the `safe-logger` utility (`lib/utils/safe-logger.ts`) which:

1. **Automatic Redaction**: Masks sensitive IDs, emails, and amounts
2. **Environment-Aware**: Only logs detailed information in development
3. **Production Safety**: Minimal logging in production to prevent information leakage

### Usage

```typescript
import { safeLog, maskId, maskEmail } from '@/lib/utils/safe-logger';

// Payment operations
safeLog.payment('Creating invoice', {
  userId,      // Automatically masked
  amount,      // Shown only in dev
  tier,        // Safe to log
});

// API operations
safeLog.api('Mayar API call', {
  endpoint: '/transactions',
  method: 'GET',
  status: 200,
});

// General logging
safeLog.info('Operation started');
safeLog.error('Operation failed', error);
```

### What Gets Masked

- **User IDs**: `abcd1234-5678-...` → `abcd****`
- **Payment IDs**: `xyz789-...` → `xyz7****`
- **Invoice IDs**: `inv123-...` → `inv1****`
- **Emails**: `user@example.com` → `u***@example.com`
- **Amounts**: `1000` → `[AMOUNT]` (in production)

## Debug Endpoints

### Production Safety

Debug endpoints are **automatically disabled in production**:

- `/api/payments/debug-mayar` - Returns 404 in production
- All debug routes check `NODE_ENV` before executing

### Development Only

Debug endpoints should:
1. Check `NODE_ENV` at the start
2. Return 404 or 403 in production
3. Never expose sensitive data even in development

## API Security

### Rate Limiting

Payment verification includes:
- Automatic retry with exponential backoff
- Rate limit detection and handling
- Maximum retry limits to prevent abuse

### Idempotency

Payment verification is idempotent:
- Duplicate verification attempts are prevented
- Already-processed payments return cached results
- No double-charging or double-processing

### State Management

Zustand store prevents:
- Race conditions
- Duplicate API calls
- State inconsistencies
- Memory leaks

## Environment Variables

### Required Variables

```env
# Mayar API
MAYAR_API_KEY=your_api_key_here
MAYAR_API_URL=https://api.mayar.id
MAYAR_WEBHOOK_SECRET=your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Security Best Practices

1. **Never commit** `.env.local` or `.env.production`
2. **Rotate keys** regularly
3. **Use different keys** for development and production
4. **Validate** all environment variables at startup

## Data Protection

### Sensitive Data

Never log or expose:
- Full user IDs (always mask)
- Full payment IDs (always mask)
- API keys or secrets
- Full email addresses
- Credit card information
- Personal identifiable information (PII)

### Database Security

- Use Row Level Security (RLS) in Supabase
- Validate user ownership before operations
- Use parameterized queries (Supabase handles this)
- Never expose service role key to client

## Vulnerability Prevention

### SQL Injection

✅ **Protected**: Supabase client uses parameterized queries

### XSS (Cross-Site Scripting)

✅ **Protected**: React escapes all user input by default

### CSRF (Cross-Site Request Forgery)

✅ **Protected**: API routes validate authentication

### Information Disclosure

✅ **Protected**: Safe logger masks all sensitive data

### Rate Limiting

✅ **Protected**: Mayar API includes rate limiting

## Incident Response

If a security issue is discovered:

1. **Do not** create a public GitHub issue
2. **Contact** the development team privately
3. **Document** the issue with steps to reproduce
4. **Wait** for confirmation before disclosure

## Compliance

### GDPR

- User data is stored securely in Supabase
- Users can request data deletion
- Data is encrypted at rest and in transit

### PCI DSS

- No credit card data is stored
- All payment processing through Mayar
- Mayar is PCI DSS compliant

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set
- [ ] Debug endpoints are disabled
- [ ] Logging uses safe-logger utility
- [ ] No sensitive data in logs
- [ ] API keys are rotated
- [ ] Database RLS is enabled
- [ ] Error messages don't expose internals
- [ ] Rate limiting is configured
- [ ] HTTPS is enforced
- [ ] Security headers are set

## Updates

This document should be reviewed and updated:
- When adding new payment features
- When adding new API endpoints
- After security audits
- When dependencies are updated
