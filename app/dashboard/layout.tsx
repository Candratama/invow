import { DashboardHeader } from "@/components/dashboard/header";
import { UserMenu } from "@/components/features/dashboard/user-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout - shared across all dashboard pages.
 * Layout is automatically cached by Next.js and not re-rendered on navigation.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userMenuSlot={<UserMenu />} />
      {children}
    </div>
  );
}
