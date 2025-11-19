/**
 * Invoice Templates
 * 
 * Export all available invoice templates
 * Each template should accept the same props: InvoiceTemplateProps
 */

export { ClassicInvoiceTemplate } from './classic-template';

// Future templates can be added here:
// export { ModernInvoiceTemplate } from './modern-template';
// export { MinimalInvoiceTemplate } from './minimal-template';
// export { ColorfulInvoiceTemplate } from './colorful-template';

/**
 * Template Registry
 * Maps template IDs to their components
 */
export const INVOICE_TEMPLATES = {
  classic: 'ClassicInvoiceTemplate',
  // modern: 'ModernInvoiceTemplate',
  // minimal: 'MinimalInvoiceTemplate',
  // colorful: 'ColorfulInvoiceTemplate',
} as const;

export type InvoiceTemplateId = keyof typeof INVOICE_TEMPLATES;
