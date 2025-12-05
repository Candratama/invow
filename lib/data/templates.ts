/**
 * Cached data fetching for invoice templates
 * Uses React cache() for request deduplication
 * 
 * Requirements: 6.1, 6.4
 */
import { cache } from "react";
import {
  TEMPLATE_CONFIGS,
  TemplateConfig,
  InvoiceTemplateId,
} from "@/components/features/invoice/templates";

/**
 * Template with active status for static generation
 */
export interface ActiveTemplate {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  tier: "free" | "premium";
  isActive: boolean;
}

/**
 * Get all active templates with React cache() for deduplication
 * Used for generateStaticParams and template listings
 * 
 * When called multiple times within a single request, the underlying
 * computation will execute only once.
 * 
 * @returns Promise<ActiveTemplate[]> - Array of active templates
 */
export const getActiveTemplates = cache(async (): Promise<ActiveTemplate[]> => {
  // All templates from TEMPLATE_CONFIGS are considered active
  // In a real scenario, this could fetch from database
  const templates: ActiveTemplate[] = Object.values(TEMPLATE_CONFIGS).map(
    (config: TemplateConfig) => ({
      id: config.id,
      name: config.name,
      description: config.description,
      tier: config.tier,
      isActive: true, // All configured templates are active
    })
  );

  return templates;
});

/**
 * Get template by ID with React cache() for deduplication
 * 
 * @param templateId - The template ID to fetch
 * @returns Promise<ActiveTemplate | null> - The template or null if not found
 */
export const getTemplateById = cache(
  async (templateId: string): Promise<ActiveTemplate | null> => {
    const config = TEMPLATE_CONFIGS[templateId as InvoiceTemplateId];
    if (!config) return null;

    return {
      id: config.id,
      name: config.name,
      description: config.description,
      tier: config.tier,
      isActive: true,
    };
  }
);

/**
 * Get all template IDs for static generation
 * Cached for deduplication across multiple calls
 * 
 * @returns Promise<string[]> - Array of template IDs
 */
export const getTemplateIds = cache(async (): Promise<string[]> => {
  return Object.keys(TEMPLATE_CONFIGS);
});
