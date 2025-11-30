/**
 * Invoice Templates
 * 
 * Export all available invoice templates
 * Each template should accept the same props: InvoiceTemplateProps
 */

export { ClassicInvoiceTemplate } from './classic-template';
export { SimpleInvoiceTemplate } from './simple-template';
export { ModernInvoiceTemplate } from './modern-template';
export { ElegantInvoiceTemplate } from './elegant-template';
export { BoldInvoiceTemplate } from './bold-template';
export { CompactInvoiceTemplate } from './compact-template';
export { CreativeInvoiceTemplate } from './creative-template';
export { CorporateInvoiceTemplate } from './corporate-template';

/**
 * Template tier configuration
 * Defines which tier can access each template
 * Requirements: 3.1, 3.2, 3.4
 */
export type TemplateTier = 'free' | 'premium';

export interface TemplateConfig {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  tier: TemplateTier;
  component: string;
}

/**
 * Template Registry with tier metadata
 * - Free tier: 1 template (classic)
 * - Premium tier: All 8 templates
 * Requirements: 3.1, 3.2
 */
export const TEMPLATE_CONFIGS: Record<InvoiceTemplateId, TemplateConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional invoice layout',
    tier: 'free',
    component: 'ClassicInvoiceTemplate',
  },
  simple: {
    id: 'simple',
    name: 'Simple',
    description: 'Clean and minimal design',
    tier: 'premium',
    component: 'SimpleInvoiceTemplate',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary style',
    tier: 'premium',
    component: 'ModernInvoiceTemplate',
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated look',
    tier: 'premium',
    component: 'ElegantInvoiceTemplate',
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Strong visual impact',
    tier: 'premium',
    component: 'BoldInvoiceTemplate',
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Space-efficient layout',
    tier: 'premium',
    component: 'CompactInvoiceTemplate',
  },
  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Unique and artistic',
    tier: 'premium',
    component: 'CreativeInvoiceTemplate',
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional business style',
    tier: 'premium',
    component: 'CorporateInvoiceTemplate',
  },
};

/**
 * Template Registry (legacy - for backward compatibility)
 * Maps template IDs to their components
 */
export const INVOICE_TEMPLATES = {
  classic: 'ClassicInvoiceTemplate',
  simple: 'SimpleInvoiceTemplate',
  modern: 'ModernInvoiceTemplate',
  elegant: 'ElegantInvoiceTemplate',
  bold: 'BoldInvoiceTemplate',
  compact: 'CompactInvoiceTemplate',
  creative: 'CreativeInvoiceTemplate',
  corporate: 'CorporateInvoiceTemplate',
} as const;

export type InvoiceTemplateId = keyof typeof INVOICE_TEMPLATES;

/**
 * Get templates available for a specific tier
 * Requirements: 3.1, 3.2
 */
export function getTemplatesForTier(tier: TemplateTier): TemplateConfig[] {
  return Object.values(TEMPLATE_CONFIGS).filter(
    (template) => template.tier === 'free' || template.tier === tier
  );
}

/**
 * Get all templates with tier access information
 * Used for displaying templates with lock/badge for free users
 * Requirements: 3.4
 */
export function getAllTemplatesWithAccess(userTier: TemplateTier): Array<TemplateConfig & { isLocked: boolean }> {
  return Object.values(TEMPLATE_CONFIGS).map((template) => ({
    ...template,
    isLocked: userTier === 'free' && template.tier === 'premium',
  }));
}

/**
 * Check if a user can access a specific template
 * Requirements: 3.1, 3.2
 */
export function canAccessTemplate(templateId: InvoiceTemplateId, userTier: TemplateTier): boolean {
  const template = TEMPLATE_CONFIGS[templateId];
  if (!template) return false;
  return template.tier === 'free' || userTier === 'premium';
}

/**
 * Get the count of available templates for a tier
 * Free: 1, Premium: 8
 * Requirements: 3.1, 3.2
 */
export function getTemplateCountForTier(tier: TemplateTier): number {
  return getTemplatesForTier(tier).length;
}
