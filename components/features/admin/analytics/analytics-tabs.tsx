"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { DollarSign, Users, FileText } from "lucide-react";

export type AnalyticsTabType = "revenue" | "users" | "invoices";

interface AnalyticsTabsProps {
  activeTab: AnalyticsTabType;
  basePath?: string;
}

const tabs: { id: AnalyticsTabType; label: string; icon: React.ReactNode }[] = [
  {
    id: "revenue",
    label: "Revenue",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    id: "users",
    label: "Users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: <FileText className="h-4 w-4" />,
  },
];

/**
 * Tab navigation component for analytics dashboard
 * Handles tab switching via URL params without full page reload
 */
export function AnalyticsTabs({
  activeTab,
  basePath = "/admin/analytics",
}: AnalyticsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tabId: AnalyticsTabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="border-b">
      <nav className="flex gap-1 -mb-px" aria-label="Analytics tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
