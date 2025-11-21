/**
 * Typography System
 * Based on golden ratio (φ = 1.618) for harmonious proportions
 * Provides consistent typography utilities for the application
 */

// Typography configuration types
export interface TypographyScale {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface TypographyConfig {
  fontSize: TypographyScale;
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
  };
}

// Heading typography constants
export const headings = {
  h1: 'text-3xl lg:text-4xl font-bold leading-tight',
  h2: 'text-2xl lg:text-3xl font-bold leading-tight',
  h3: 'text-xl lg:text-2xl font-semibold leading-snug',
  h4: 'text-lg lg:text-xl font-semibold leading-snug',
} as const;

// Body text variants
export const body = {
  base: 'text-base leading-relaxed',
  large: 'text-lg leading-relaxed',
  small: 'text-sm leading-normal',
  tiny: 'text-xs leading-normal',
} as const;

// UI element typography
export const ui = {
  // Buttons
  button: 'text-sm lg:text-base font-medium',
  buttonSmall: 'text-sm font-medium',
  buttonLarge: 'text-base lg:text-lg font-medium',
  
  // Labels and form elements
  label: 'text-sm font-medium text-gray-700',
  input: 'text-base',
  helper: 'text-xs text-gray-500',
  error: 'text-xs text-red-600',
  
  // Captions and metadata
  caption: 'text-xs text-gray-500',
  metadata: 'text-xs text-gray-500',
  
  // Navigation
  navItem: 'text-sm lg:text-base font-medium',
  tabItem: 'text-xs lg:text-sm font-medium',
} as const;

// Complete typography configuration
export const typographyConfig: TypographyConfig = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.4,
    normal: 1.5,
    relaxed: 1.618, // Golden ratio
  },
};

// Component-specific typography mapping
export const componentTypography = {
  // Cards
  card: {
    title: 'text-base font-bold leading-snug',
    subtitle: 'text-sm text-gray-600',
    metadata: 'text-xs text-gray-500',
    amount: 'text-sm font-medium',
  },
  
  // Buttons
  button: {
    sm: 'text-sm font-medium',
    base: 'text-sm lg:text-base font-medium',
    lg: 'text-base lg:text-lg font-medium',
  },
  
  // Forms
  form: {
    label: 'text-sm font-medium text-gray-700',
    input: 'text-base',
    helper: 'text-xs text-gray-500',
    error: 'text-xs text-red-600',
    placeholder: 'text-base text-gray-400',
  },
  
  // Headers
  header: {
    pageTitle: 'text-lg lg:text-xl font-semibold',
    sectionTitle: 'text-lg lg:text-xl font-semibold',
    subsectionTitle: 'text-base lg:text-lg font-medium',
  },
  
  // Tables
  table: {
    header: 'text-sm font-medium',
    body: 'text-sm',
    metadata: 'text-xs text-gray-500',
  },
  
  // Dashboard
  dashboard: {
    welcomeMessage: 'text-base lg:text-lg font-semibold',
    cardHeading: 'text-base lg:text-lg font-semibold',
    cardValue: 'text-2xl lg:text-3xl font-bold',
    cardLabel: 'text-sm text-gray-600',
  },
  
  // Invoice
  invoice: {
    title: 'text-2xl lg:text-3xl font-bold',
    customerInfo: 'text-base',
    itemDescription: 'text-sm',
    totals: 'text-base lg:text-lg font-semibold',
  },
} as const;

// Export all typography utilities
export const typography = {
  headings,
  body,
  ui,
  config: typographyConfig,
  components: componentTypography,
} as const;

// Type exports for TypeScript consumers
export type HeadingLevel = keyof typeof headings;
export type BodyVariant = keyof typeof body;
export type UIElement = keyof typeof ui;
export type ComponentType = keyof typeof componentTypography;
