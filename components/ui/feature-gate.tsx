"use client";

import { useState, ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import UpgradeModal from "@/components/features/subscription/upgrade-modal";

export type GatedFeature =
  | "hasLogo"
  | "hasSignature"
  | "hasBrandColor"
  | "hasCustomColors"
  | "hasMonthlyReport"
  | "hasDashboardTotals";

interface FeatureGateProps {
  /** The feature to gate access for */
  feature: GatedFeature;
  /** Whether the user has access to this feature (isPremium) */
  hasAccess: boolean;
  /** Content to render when user has access */
  children: ReactNode;
  /** Optional custom fallback when feature is locked */
  fallback?: ReactNode;
  /** Whether to show the Premium badge on locked features */
  showBadge?: boolean;
  /** Custom feature name for the upgrade modal */
  featureName?: string;
  /** Custom feature description for the upgrade modal */
  featureDescription?: string;
  /** Additional className for the wrapper */
  className?: string;
}

const FEATURE_DISPLAY_NAMES: Record<GatedFeature, string> = {
  hasLogo: "Custom Logo",
  hasSignature: "Digital Signature",
  hasBrandColor: "Custom Brand Color",
  hasCustomColors: "Custom Brand Colors",
  hasMonthlyReport: "Monthly Reports",
  hasDashboardTotals: "Dashboard Totals",
};

const FEATURE_DESCRIPTIONS: Record<GatedFeature, string> = {
  hasLogo: "Add your company logo to invoices for a professional look.",
  hasSignature: "Add your digital signature to authenticate invoices.",
  hasBrandColor:
    "Choose your own brand color for invoices instead of the default gold.",
  hasCustomColors: "Customize invoice colors to match your brand identity.",
  hasMonthlyReport: "Get detailed monthly reports of your invoicing activity.",
  hasDashboardTotals: "View total invoice count and revenue on your dashboard.",
};

/**
 * FeatureGate component that restricts access to premium features.
 * Shows a disabled state with "Premium" badge for free users and
 * triggers an upgrade modal when clicked.
 *
 * Requirements: 4.1, 5.1, 6.1, 10.1
 */
export function FeatureGate({
  feature,
  hasAccess,
  children,
  fallback,
  showBadge = true,
  featureName,
  featureDescription,
  className,
}: FeatureGateProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // If user has access, render children directly
  if (hasAccess) {
    return <>{children}</>;
  }

  const displayName = featureName || FEATURE_DISPLAY_NAMES[feature];
  const description = featureDescription || FEATURE_DESCRIPTIONS[feature];

  const handleClick = () => {
    setIsUpgradeModalOpen(true);
  };

  // If custom fallback is provided, use it
  if (fallback) {
    return (
      <>
        <div
          onClick={handleClick}
          className={cn("cursor-pointer", className)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label={`Unlock ${displayName} - Premium feature`}
        >
          {fallback}
        </div>
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          feature={displayName}
          featureDescription={description}
        />
      </>
    );
  }

  // Default locked state UI
  return (
    <>
      <div
        onClick={handleClick}
        className={cn("relative cursor-pointer group", className)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`Unlock ${displayName} - Premium feature`}
      >
        {/* Disabled overlay with children */}
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>

        {/* Premium badge overlay */}
        {showBadge && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg transition-colors group-hover:bg-background/70">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full shadow-md">
              <Lock className="w-3.5 h-3.5" />
              <span>Premium</span>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature={displayName}
        featureDescription={description}
      />
    </>
  );
}

export default FeatureGate;
