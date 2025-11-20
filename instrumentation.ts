/**
 * Next.js Instrumentation
 * 
 * This file runs once when the Next.js server starts up.
 * Used for environment validation and other startup tasks.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateAndLogEnvironment } = await import('./lib/utils/env-validation');
    validateAndLogEnvironment();
  }
}
