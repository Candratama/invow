import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/features/dashboard/user-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Dashboard Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <UserMenu />
        </div>
      </header>

      {/* Page Content */}
      {children}
    </div>
  );
}
