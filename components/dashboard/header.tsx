"use cache";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";

interface DashboardHeaderProps {
  /**
   * Slot for dynamic user menu component (client component).
   * This is the "hole" in the donut pattern where interactive content goes.
   */
  userMenuSlot?: React.ReactNode;
}

/**
 * Cached header component for the dashboard shell.
 * This component is part of the donut pattern - it's a static server component
 * that gets cached and served instantly while dynamic content loads.
 *
 * The userMenuSlot prop allows passing in a client component for user-specific
 * interactive elements without breaking the cache.
 */
export async function DashboardHeader({ userMenuSlot }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" prefetch={true}>
          <Logo />
        </Link>
        {/* Dynamic slot for user menu - this is the "hole" in the donut */}
        {userMenuSlot}
      </div>
    </header>
  );
}
