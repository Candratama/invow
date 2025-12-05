import Link from "next/link";
import { Logo } from "@/components/ui/logo";

interface DashboardHeaderProps {
  userMenuSlot?: React.ReactNode;
}

export function DashboardHeader({ userMenuSlot }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" prefetch={true}>
          <Logo />
        </Link>
        {userMenuSlot}
      </div>
    </header>
  );
}
