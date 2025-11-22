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
 * Template Registry
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
