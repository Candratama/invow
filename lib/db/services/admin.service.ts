/**
 * Admin Service
 * Handles admin authentication and authorization checks
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Create Supabase admin client with service role key
 * This client bypasses RLS and can access auth.users metadata
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if a user has admin privileges
 * @param userId - The user ID to check
 * @returns True if user is an admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (error || !user) {
      return false;
    }

    // Check is_admin flag in user metadata
    const isAdminFlag = user.user?.user_metadata?.is_admin === true;
    
    return isAdminFlag;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin user details
 * @param userId - The user ID to get details for
 * @returns Admin user details or null if not found/not admin
 */
export async function getAdminUser(userId: string): Promise<{
  id: string;
  email: string;
  is_admin: boolean;
} | null> {
  if (!userId) {
    return null;
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (error || !user?.user) {
      return null;
    }

    const isAdminFlag = user.user.user_metadata?.is_admin === true;

    if (!isAdminFlag) {
      return null;
    }

    return {
      id: user.user.id,
      email: user.user.email || "",
      is_admin: true,
    };
  } catch (error) {
    console.error("Error getting admin user:", error);
    return null;
  }
}
