/**
 * Safe Logger Utility
 * Provides logging functions that automatically redact sensitive information
 * and only log in development environment
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Mask sensitive ID - shows only first 4 characters
 * @param id - Full ID to mask
 * @returns Masked ID (e.g., "abcd****")
 */
export function maskId(id: string | null | undefined): string {
  if (!id) return '[REDACTED]';
  if (id.length <= 4) return '****';
  return `${id.substring(0, 4)}****`;
}

/**
 * Mask email address
 * @param email - Email to mask
 * @returns Masked email (e.g., "u***@example.com")
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[REDACTED]';
  const [local, domain] = email.split('@');
  if (!domain) return '[REDACTED]';
  return `${local.charAt(0)}***@${domain}`;
}

/**
 * Mask amount - only show in development
 * @param amount - Amount to mask
 * @returns Masked amount or actual amount in dev
 */
export function maskAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '[REDACTED]';
  return IS_DEVELOPMENT ? amount.toString() : '[AMOUNT]';
}

/**
 * Safe log - only logs in development, redacts in production
 */
export const safeLog = {
  /**
   * Log info message (only in development)
   */
  info: (message: string, ...args: unknown[]) => {
    if (IS_DEVELOPMENT) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log error message (always logs, but redacts sensitive data)
   */
  error: (message: string, error?: unknown) => {
    if (IS_PRODUCTION) {
      // In production, only log the message without details
      console.error(`[ERROR] ${message}`);
    } else {
      // In development, log full error
      console.error(`[ERROR] ${message}`, error);
    }
  },

  /**
   * Log warning message (only in development)
   */
  warn: (message: string, ...args: unknown[]) => {
    if (IS_DEVELOPMENT) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Log payment operation (with automatic redaction)
   */
  payment: (operation: string, data: {
    userId?: string;
    paymentId?: string;
    invoiceId?: string;
    amount?: number;
    tier?: string;
    status?: string;
  }) => {
    if (!IS_DEVELOPMENT) return;

    const safeData = {
      userId: data.userId ? maskId(data.userId) : undefined,
      paymentId: data.paymentId ? maskId(data.paymentId) : undefined,
      invoiceId: data.invoiceId ? maskId(data.invoiceId) : undefined,
      amount: data.amount ? maskAmount(data.amount) : undefined,
      tier: data.tier,
      status: data.status,
    };

    console.log(`[PAYMENT] ${operation}`, safeData);
  },

  /**
   * Log API operation (with automatic redaction)
   */
  api: (operation: string, data: {
    endpoint?: string;
    method?: string;
    status?: number;
    duration?: number;
  }) => {
    if (!IS_DEVELOPMENT) return;

    console.log(`[API] ${operation}`, {
      endpoint: data.endpoint,
      method: data.method,
      status: data.status,
      duration: data.duration ? `${data.duration}ms` : undefined,
    });
  },
};

/**
 * Redact sensitive fields from objects before logging
 */
export function redactSensitiveData<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'apiKey', 'secret', 'authorization']
): Record<string, unknown> {
  const redacted: Record<string, unknown> = { ...obj };
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  return redacted;
}
