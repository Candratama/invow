"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useInvoiceStore } from "@/lib/store";

/**
 * UserIdSync Component
 *
 * Syncs the authenticated user's ID to the invoice store
 * This ensures invoice numbers use a consistent code based on the user's UUID
 */
export function UserIdSync() {
  const { user } = useAuth();
  const setUserId = useInvoiceStore((state) => state.setUserId);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else {
      setUserId(null);
    }
  }, [user, setUserId]);

  // This component doesn't render anything
  return null;
}
