"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Settings, Users, Menu, FileText, X, BarChart3 } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const lastPrefetchRef = useRef<Record<string, number>>({});

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Lazy-fire React Query prefetches when user hovers a nav target so the
  // destination page already has data warm by the time the click lands.
  const prefetch = useCallback(
    (target: "customers" | "report" | "settings") => {
      const now = Date.now();
      if (now - (lastPrefetchRef.current[target] ?? 0) < 1500) return;
      lastPrefetchRef.current[target] = now;

      if (target === "customers") {
        // Warm storeId — customers list depends on it for queryKey.
        void queryClient.prefetchQuery({
          queryKey: ["store", "data"],
          queryFn: async () => {
            const { getStoreAction } = await import("@/app/actions/store");
            const result = await getStoreAction();
            return result.success && result.data ? result.data : null;
          },
          staleTime: 5 * 60 * 1000,
        });
      } else if (target === "report") {
        // Warm the subscription status so report's gating resolves instantly
        void queryClient.prefetchQuery({
          queryKey: ["premium-status", "status"],
          queryFn: async () => {
            const { getSubscriptionStatusAction } = await import(
              "@/app/actions/subscription"
            );
            const result = await getSubscriptionStatusAction();
            return result;
          },
          staleTime: 5 * 60 * 1000,
        });
      } else if (target === "settings") {
        void queryClient.prefetchQuery({
          queryKey: ["settings", "data"],
          queryFn: async () => {
            const { getSettingsDataAction } = await import(
              "@/app/actions/settings"
            );
            const result = await getSettingsDataAction();
            return result;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    },
    [queryClient]
  );

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={18} />
            <span className="text-sm font-medium">Invoices</span>
          </Link>
          <Link
            href="/dashboard/customers"
            onClick={() => setIsOpen(false)}
            onMouseEnter={() => prefetch("customers")}
            onFocus={() => prefetch("customers")}
            onTouchStart={() => prefetch("customers")}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Users size={18} />
            <span className="text-sm font-medium">Customers</span>
          </Link>
          <Link
            href="/dashboard/report"
            onClick={() => setIsOpen(false)}
            onMouseEnter={() => prefetch("report")}
            onFocus={() => prefetch("report")}
            onTouchStart={() => prefetch("report")}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 size={18} />
            <span className="text-sm font-medium">Report</span>
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            onMouseEnter={() => prefetch("settings")}
            onFocus={() => prefetch("settings")}
            onTouchStart={() => prefetch("settings")}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      )}
    </div>
  );
}
