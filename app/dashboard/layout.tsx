import { AuthProvider } from "@/lib/auth/auth-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserMenu } from "@/components/features/dashboard/user-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userMenuSlot={<UserMenu />} />
        {children}
      </div>
    </AuthProvider>
  );
}
