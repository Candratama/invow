"use cache";

import { DashboardHeader } from "@/components/dashboard/header";
import { UserMenu } from "@/components/features/dashboard/user-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout implementing the donut pattern.
 *
 * The "donut" (cached shell):
 * - DashboardHeader: Static header with logo (cached)
 * - Background and container styling (cached)
 *
 * The "hole" (dynamic content):
 * - UserMenu: Client component for user-specific interactions
 * - children: Dynamic page content
 *
 * This pattern allows the static shell to be pre-rendered and cached
 * while dynamic content streams in, improving perceived performance.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cached Dashboard Header with dynamic UserMenu slot */}
      <DashboardHeader userMenuSlot={<UserMenu />} />

      {/* Dynamic Page Content - the "hole" in the donut */}
      {children}
    </div>
  );
}
