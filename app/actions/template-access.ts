"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TemplateAccessRule {
  id: string;
  template_id: string;
  enabled: boolean;
  access_type: "free" | "premium" | "whitelist";
  whitelist_emails: string[];
}

/**
 * Get all template access rules
 */
export async function getTemplateAccessRulesAction() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("template_access_rules")
      .select("*")
      .order("template_id");

    if (error) {
      console.error("Error fetching template access rules:", error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getTemplateAccessRulesAction:", error);
    return { success: false, error: "Failed to fetch template access rules", data: null };
  }
}

/**
 * Update a template access rule (admin only)
 */
export async function updateTemplateAccessRuleAction(
  templateId: string,
  updates: {
    enabled?: boolean;
    access_type?: "free" | "premium" | "whitelist";
    whitelist_emails?: string[];
  }
) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const isAdmin = user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    const { error } = await supabase
      .from("template_access_rules")
      .update(updates)
      .eq("template_id", templateId);

    if (error) {
      console.error("Error updating template access rule:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/templates");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Error in updateTemplateAccessRuleAction:", error);
    return { success: false, error: "Failed to update template access rule" };
  }
}
