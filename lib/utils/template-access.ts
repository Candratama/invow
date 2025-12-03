/**
 * Template Access Control
 * Manages template availability based on:
 * - User tier (free/premium)
 * - Email whitelist
 * - Template enabled status
 */

export interface TemplateAccessRule {
  id: string;
  enabled: boolean;
  accessType: "free" | "premium" | "whitelist";
  whitelistEmails: string[];
}

// Default template access rules (fallback)
const DEFAULT_TEMPLATE_ACCESS: TemplateAccessRule[] = [
  { id: "classic", enabled: true, accessType: "premium", whitelistEmails: [] },
  { id: "simple", enabled: true, accessType: "free", whitelistEmails: [] },
  { id: "modern", enabled: true, accessType: "premium", whitelistEmails: [] },
  { id: "elegant", enabled: true, accessType: "premium", whitelistEmails: [] },
  { id: "bold", enabled: true, accessType: "premium", whitelistEmails: [] },
  { id: "compact", enabled: true, accessType: "premium", whitelistEmails: [] },
  { id: "creative", enabled: true, accessType: "premium", whitelistEmails: [] },
  { id: "corporate", enabled: true, accessType: "premium", whitelistEmails: [] },
];

/**
 * Get default template access rules (for fallback)
 */
export function getDefaultTemplateAccessRules(): TemplateAccessRule[] {
  return DEFAULT_TEMPLATE_ACCESS;
}

/**
 * Convert database format to client format
 */
export function convertDbRulesToClientFormat(
  dbRules: Array<{
    template_id: string;
    enabled: boolean;
    access_type: string;
    whitelist_emails: string[];
  }>
): TemplateAccessRule[] {
  return dbRules.map((rule) => ({
    id: rule.template_id,
    enabled: rule.enabled,
    accessType: rule.access_type as "free" | "premium" | "whitelist",
    whitelistEmails: rule.whitelist_emails || [],
  }));
}

/**
 * Check if user can access a template
 */
export function canUserAccessTemplate(
  templateId: string,
  userTier: "free" | "premium",
  userEmail: string,
  accessRules?: TemplateAccessRule[]
): boolean {
  const rules = accessRules || getDefaultTemplateAccessRules();
  const rule = rules.find((r: TemplateAccessRule) => r.id === templateId);

  // Template not found or disabled
  if (!rule || !rule.enabled) {
    return false;
  }

  // Check access type
  switch (rule.accessType) {
    case "free":
      return true; // Available to all users

    case "premium":
      return userTier === "premium"; // Only premium users

    case "whitelist":
      // Only whitelisted emails
      return rule.whitelistEmails.includes(userEmail.toLowerCase());

    default:
      return false;
  }
}

/**
 * Get available templates for user
 * Returns only templates that user can access
 */
export function getAvailableTemplatesForUser(
  userTier: "free" | "premium",
  userEmail: string,
  accessRules?: TemplateAccessRule[]
): string[] {
  const rules = accessRules || getDefaultTemplateAccessRules();
  return rules
    .filter((rule: TemplateAccessRule) =>
      canUserAccessTemplate(rule.id, userTier, userEmail, rules)
    )
    .map((rule: TemplateAccessRule) => rule.id);
}

/**
 * Filter templates with access information
 */
export function getTemplatesWithAccessInfo<T extends { id: string }>(
  templates: T[],
  userTier: "free" | "premium",
  userEmail: string,
  accessRules?: TemplateAccessRule[]
): Array<T & { isLocked: boolean; isHidden: boolean }> {
  const rules = accessRules || getDefaultTemplateAccessRules();
  return templates
    .map((template) => {
      const rule = rules.find((r: TemplateAccessRule) => r.id === template.id);
      const canAccess = canUserAccessTemplate(
        template.id,
        userTier,
        userEmail,
        rules
      );

      // Hide whitelist templates from non-whitelisted users
      const isHidden =
        rule?.accessType === "whitelist" &&
        !rule.whitelistEmails.includes(userEmail.toLowerCase());

      return {
        ...template,
        isLocked: !canAccess && !isHidden,
        isHidden,
      };
    })
    .filter((t) => !t.isHidden); // Remove hidden templates
}
