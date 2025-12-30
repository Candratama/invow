/**
 * Test utilities for Settings Tab Reorganization feature
 * Provides generators and helpers for property-based testing
 */

import fc from 'fast-check';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MockSubscriptionStatus {
  tier: string;
  invoiceLimit: number;
  currentMonthCount: number;
  remainingInvoices: number;
  monthYear: string;
  resetDate: Date;
}

export interface MockBusinessInfo {
  name: string;
  storeDescription?: string;
  storeNumber?: string;
  address: string;
  whatsapp: string;
  email?: string;
  phone?: string;
  website?: string;
  tagline?: string;
  logo?: string;
  brandColor: string;
}

export interface MockAuthorizedPerson {
  id: string;
  name: string;
  title?: string;
  signature?: string;
  is_primary: boolean;
}

export interface MockInvoiceSettings {
  selectedTemplate: string;
  paymentMethod?: string;
  taxEnabled: boolean;
  taxPercentage?: number;
  exportQuality: 50 | 100 | 150;
}

// ============================================================================
// Fast-check Arbitraries (Generators)
// ============================================================================

/**
 * Generate valid hex colors in format #RRGGBB
 */
export const hexColorArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
});

/**
 * Generate valid Indonesian WhatsApp numbers (+62 prefix)
 */
export const whatsappArbitrary = fc
  .integer({ min: 10000000, max: 999999999 })
  .map((num) => `+62${num}`);

/**
 * Generate valid email addresses
 */
export const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]+$/),
    fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'example.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

/**
 * Generate valid URLs
 */
export const urlArbitrary = fc
  .tuple(
    fc.constantFrom('http', 'https'),
    fc.stringMatching(/^[a-z0-9-]+$/),
    fc.constantFrom('com', 'net', 'org', 'id')
  )
  .map(([protocol, domain, tld]) => `${protocol}://${domain}.${tld}`);

/**
 * Generate valid phone numbers
 */
export const phoneArbitrary = fc
  .integer({ min: 1000000000, max: 9999999999 })
  .map((num) => `+${num}`);

/**
 * Generate subscription tiers
 */
export const subscriptionTierArbitrary = fc.constantFrom('free', 'pro', 'enterprise');

/**
 * Generate invoice template IDs
 */
export const templateIdArbitrary = fc.constantFrom(
  'classic',
  'modern',
  'elegant',
  'simple',
  'bold',
  'compact',
  'corporate',
  'creative'
);

/**
 * Generate export quality values
 */
export const exportQualityArbitrary = fc.constantFrom(50, 100, 150) as fc.Arbitrary<50 | 100 | 150>;

/**
 * Generate tax percentages (0-100)
 */
export const taxPercentageArbitrary = fc.integer({ min: 0, max: 100 });

/**
 * Generate valid business info data
 */
export const businessInfoArbitrary: fc.Arbitrary<MockBusinessInfo> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  storeDescription: fc.option(fc.string({ maxLength: 500 })),
  storeNumber: fc.option(fc.string({ maxLength: 50 })),
  address: fc.string({ minLength: 1, maxLength: 200 }),
  whatsapp: whatsappArbitrary,
  email: fc.option(emailArbitrary),
  phone: fc.option(phoneArbitrary),
  website: fc.option(urlArbitrary),
  tagline: fc.option(fc.string({ maxLength: 100 })),
  logo: fc.option(fc.string()),
  brandColor: hexColorArbitrary,
});

/**
 * Generate valid authorized person data
 */
export const authorizedPersonArbitrary: fc.Arbitrary<MockAuthorizedPerson> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  title: fc.option(fc.string({ maxLength: 100 })),
  signature: fc.option(fc.string()),
  is_primary: fc.boolean(),
});

/**
 * Generate valid invoice settings data
 */
export const invoiceSettingsArbitrary: fc.Arbitrary<MockInvoiceSettings> = fc.record({
  selectedTemplate: templateIdArbitrary,
  paymentMethod: fc.option(fc.string({ maxLength: 200 })),
  taxEnabled: fc.boolean(),
  taxPercentage: fc.option(taxPercentageArbitrary),
  exportQuality: exportQualityArbitrary,
});

/**
 * Generate valid subscription status data
 */
export const subscriptionStatusArbitrary: fc.Arbitrary<MockSubscriptionStatus> = fc.record({
  tier: subscriptionTierArbitrary,
  invoiceLimit: fc.integer({ min: 10, max: 10000 }),
  currentMonthCount: fc.integer({ min: 0, max: 10000 }),
  remainingInvoices: fc.integer({ min: 0, max: 10000 }),
  monthYear: fc.integer({ min: 2020, max: 2030 }).chain((year) =>
    fc.integer({ min: 1, max: 12 }).map((month) => `${year}-${String(month).padStart(2, '0')}`)
  ),
  resetDate: fc.date(),
});

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate invalid business info data for validation testing
 */
export const invalidBusinessInfoArbitrary = fc.oneof(
  // Empty required fields
  fc.record({
    name: fc.constant(''),
    address: fc.string({ minLength: 1 }),
    whatsapp: whatsappArbitrary,
    brandColor: hexColorArbitrary,
  }),
  fc.record({
    name: fc.string({ minLength: 1 }),
    address: fc.constant(''),
    whatsapp: whatsappArbitrary,
    brandColor: hexColorArbitrary,
  }),
  fc.record({
    name: fc.string({ minLength: 1 }),
    address: fc.string({ minLength: 1 }),
    whatsapp: fc.constant(''),
    brandColor: hexColorArbitrary,
  }),
  // Invalid email format
  fc.record({
    name: fc.string({ minLength: 1 }),
    address: fc.string({ minLength: 1 }),
    whatsapp: whatsappArbitrary,
    email: fc.string().filter((s) => !s.includes('@')),
    brandColor: hexColorArbitrary,
  }),
  // Invalid hex color
  fc.record({
    name: fc.string({ minLength: 1 }),
    address: fc.string({ minLength: 1 }),
    whatsapp: whatsappArbitrary,
    brandColor: fc.string().filter((s) => !s.match(/^#[0-9A-Fa-f]{6}$/)),
  })
);

/**
 * Generate invalid invoice settings for validation testing
 */
export const invalidInvoiceSettingsArbitrary = fc.oneof(
  // Tax percentage out of range
  fc.record({
    selectedTemplate: templateIdArbitrary,
    taxEnabled: fc.constant(true),
    taxPercentage: fc.integer({ min: 101, max: 200 }),
    exportQuality: exportQualityArbitrary,
  }),
  fc.record({
    selectedTemplate: templateIdArbitrary,
    taxEnabled: fc.constant(true),
    taxPercentage: fc.integer({ min: -100, max: -1 }),
    exportQuality: exportQualityArbitrary,
  }),
  // Invalid export quality
  fc.record({
    selectedTemplate: templateIdArbitrary,
    taxEnabled: fc.boolean(),
    exportQuality: fc.integer({ min: 200, max: 500 }) as unknown as fc.Arbitrary<50 | 100 | 150>,
  })
);

/**
 * Mock user for authentication context
 */
export const createMockUser = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock store data
 */
export const createMockStore = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 'store-1',
  user_id: 'user-123',
  name: 'Test Store',
  address: '123 Test St',
  whatsapp: '+62812345678',
  brand_color: '#FFB300',
  store_code: 'TST',
  invoice_prefix: 'INV',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  store_contacts: [],
  ...overrides,
});
