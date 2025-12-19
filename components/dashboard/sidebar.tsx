"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { FileText, Settings, Users } from "lucide-react";
import { usePremiumStatus } from "@/lib/hooks/use-premium-status";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

function SidebarLink({ href, icon, label, badge }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      prefetch={true}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {badge}
    </Link>
  );
}

/**
 * Dashboard sidebar component with premium status awareness.
 * Shows a "Pro" badge next to Customers menu item for free users.
 * Requirements: 2.1
 */
export function DashboardSidebar() {
  const { isPremium, isLoading } = usePremiumStatus();

  // Show Pro badge for free users (not loading and not premium)
  const showProBadge = !isLoading && !isPremium;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/dashboard" prefetch={true}>
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <SidebarLink
          href="/dashboard"
          icon={<FileText size={20} />}
          label="Invoices"
        />
        <SidebarLink
          href="/dashboard/customers"
          icon={<Users size={20} />}
          label="Customers"
          badge={
            showProBadge ? (
              <span className="ml-auto inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold rounded">
                Pro
              </span>
            ) : undefined
          }
        />
        <SidebarLink
          href="/dashboard/settings"
          icon={<Settings size={20} />}
          label="Settings"
        />
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Invow
        </p>
      </div>
    </aside>
  );
}
