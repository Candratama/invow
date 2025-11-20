/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at application startup
 * to prevent runtime errors and provide clear error messages.
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all required environment variables
 * @returns Validation result with errors and warnings
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required Supabase variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  // Required Mayar variables
  if (!process.env.MAYAR_API_KEY) {
    errors.push('MAYAR_API_KEY is required for payment processing');
  }
  if (!process.env.MAYAR_API_URL) {
    errors.push('MAYAR_API_URL is required for payment processing');
  }

  // Required Application variables
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required for payment redirect flow');
  } else {
    // Validate URL format
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      
      // Warn if using HTTP in production
      if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
        warnings.push(
          'NEXT_PUBLIC_APP_URL uses HTTP in production. HTTPS is strongly recommended for security.'
        );
      }
      
      // Warn if using localhost in production
      if (process.env.NODE_ENV === 'production' && 
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        warnings.push(
          'NEXT_PUBLIC_APP_URL uses localhost in production. This will prevent payment redirects from working.'
        );
      }
    } catch {
      errors.push('NEXT_PUBLIC_APP_URL is not a valid URL');
    }
  }



  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment variables and logs results
 * Throws error if validation fails in production
 */
export function validateAndLogEnvironment(): void {
  const result = validateEnvironmentVariables();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  // Handle errors
  if (!result.isValid) {
    console.error('❌ Environment Configuration Errors:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });

    // In production, throw error to prevent startup
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Application cannot start due to missing required environment variables. ' +
        'Please check the logs above and configure all required variables.'
      );
    } else {
      // In development, just warn
      console.warn(
        '\n⚠️  Application may not function correctly without these variables.\n' +
        'Please check .env.example for required configuration.\n'
      );
    }
  } else {
    console.log('✅ Environment variables validated successfully');
  }
}
