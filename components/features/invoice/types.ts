/**
 * Invoice Template Types
 */

import { Invoice, StoreSettings } from "@/lib/types";

/** Default primary color for free users - Gold */
export const DEFAULT_BRAND_COLOR = "#D3AF37";

/**
 * Props for all invoice templates
 * All templates must accept these props
 */
export interface InvoiceTemplateProps {
  invoice: Invoice;
  storeSettings: StoreSettings | null;
  preview?: boolean;
  taxEnabled?: boolean;
  taxPercentage?: number;
  /** User's subscription tier - defaults to 'free' */
  tier?: string;
}

/**
 * Template metadata for UI selection
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  isPremium?: boolean;
}
