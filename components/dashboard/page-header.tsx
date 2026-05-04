"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  /** Where back button navigates. If omitted, uses router.back() */
  backHref?: string;
  /** Override back behavior with custom handler */
  onBack?: () => void;
  /** Hide back button on desktop (lg+) */
  hideBackOnDesktop?: boolean;
  /** Right-side actions (button, etc.) */
  actions?: React.ReactNode;
}

/**
 * Consistent sticky sub-header for dashboard pages.
 * Sits below the global DashboardHeader and provides page title + back nav.
 */
export function PageHeader({
  title,
  backHref,
  onBack,
  hideBackOnDesktop = false,
  actions,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className={`text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2 ${
                hideBackOnDesktop ? "lg:hidden" : ""
              }`}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
