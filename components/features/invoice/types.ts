/**
 * Invoice Template Types
 */

import { Invoice, StoreSettings } from "@/lib/types";

/**
 * Props for all invoice templates
 * All templates must accept these props
 */
export interface InvoiceTemplateProps {
  invoice: Invoice;
  storeSettings: StoreSettings | null;
  preview?: boolean;
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
