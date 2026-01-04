"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { FileText, Settings, Users, BarChart3 } from "lucide-react";
import { usePremiumStatus } from "@/lib/hooks/use-premium-status";
import {
  usePrefetchDashboard,
  usePrefetchSettings,
  usePrefetchCustomers,
  usePrefetchReport,
} from "@/lib/hooks/use-prefetch";
import { useRevenueData } from "@/lib/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  onPrefetch?: () => void;
  isActive?: boolean;
}

function SidebarLink({
  href,
  icon,
  label,
  badge,
  onPrefetch,
  isActive,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        isActive
          ? "text-gray-900 bg-gray-100 font-semibold"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      )}
      prefetch={true}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {badge}
    </Link>
  );
}

/**
 * Dashboard sidebar component with premium status awareness and prefetching.
 * Shows a "Pro" badge next to Customers menu item for free users.
 * Prefetches page data on hover/focus for instant navigation.
 * Requirements: 1.3, 2.1, 4.2
 */
export function DashboardSidebar() {
  const pathname = usePathname();
  const { isPremium, isLoading } = usePremiumStatus();

  // Get storeId from revenue data for customers prefetch
  const { data: revenueData } = useRevenueData();
  const storeId = revenueData?.defaultStore?.id;

  // Prefetch hooks for instant navigation
  const prefetchDashboard = usePrefetchDashboard();
  const prefetchSettings = usePrefetchSettings();
  const prefetchCustomers = usePrefetchCustomers(storeId);
  const prefetchReport = usePrefetchReport();

  // Show Pro badge for free users (not loading and not premium)
  const showProBadge = !isLoading && !isPremium;

  // Determine active state based on current pathname
  const isDashboardActive = pathname === "/dashboard";
  const isCustomersActive = pathname === "/dashboard/customers";
  const isReportActive = pathname === "/dashboard/report";
  const isSettingsActive = pathname === "/dashboard/settings";

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link
          href="/dashboard"
          prefetch={true}
          onMouseEnter={prefetchDashboard}
          onFocus={prefetchDashboard}
        >
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <SidebarLink
          href="/dashboard"
          icon={<FileText size={20} />}
          label="Invoices"
          onPrefetch={prefetchDashboard}
          isActive={isDashboardActive}
        />
        <SidebarLink
          href="/dashboard/customers"
          icon={<Users size={20} />}
          label="Customers"
          onPrefetch={prefetchCustomers}
          isActive={isCustomersActive}
          badge={
            showProBadge ? (
              <span className="ml-auto inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold rounded">
                Pro
              </span>
            ) : undefined
          }
        />
        <SidebarLink
          href="/dashboard/report"
          icon={<BarChart3 size={20} />}
          label="Laporan"
          onPrefetch={prefetchReport}
          isActive={isReportActive}
        />
        <SidebarLink
          href="/dashboard/settings"
          icon={<Settings size={20} />}
          label="Settings"
          onPrefetch={prefetchSettings}
          isActive={isSettingsActive}
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
