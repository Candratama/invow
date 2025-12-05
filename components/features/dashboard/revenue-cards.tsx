import { useState } from "react";
import { Eye, EyeOff, TrendingUp, FileText, Zap, Lock } from "lucide-react";
import { RevenueMetrics } from "@/lib/utils/revenue";
import { formatCurrency } from "@/lib/utils";
import { RevenueCardSkeleton } from "@/components/skeletons/revenue-card-skeleton";
import UpgradeModal from "@/components/features/subscription/upgrade-modal";

interface RevenueCardsProps {
  metrics: RevenueMetrics;
  subscriptionStatus: {
    remainingInvoices: number;
    invoiceLimit: number;
    tier: string;
  } | null;
  isLoading?: boolean;
}

function formatCurrencyWithDots(amount: number): string {
  const formatted = formatCurrency(amount);

  // Indonesian Rupiah typically formats as "Rp1.000.000" or "Rp 1.000.000"
  // Normalize to handle both regular space and non-breaking space
  const normalizedFormatted = formatted.replace(/[\u00A0\s]+/, " ");
  const rpMatch = normalizedFormatted.match(/^Rp\s?(.+)$/);
  if (rpMatch) {
    const number = rpMatch[1]; // Get the number part after "Rp"
    return `Rp ${"*".repeat(number.replace(/\s/g, "").length)}`;
  }

  return formatted; // Fallback to original if format doesn't match
}

export function RevenueCards({
  metrics,
  subscriptionStatus,
  isLoading = false,
}: RevenueCardsProps) {
  const [isAmountVisible, setIsAmountVisible] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Show skeleton when loading
  if (isLoading) {
    return <RevenueCardSkeleton />;
  }

  const toggleVisibility = () => {
    setIsAmountVisible(!isAmountVisible);
  };

  const isPremium = subscriptionStatus?.tier === "premium";

  const displayMonthlyRevenue = isAmountVisible
    ? formatCurrency(metrics.monthlyRevenue).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(metrics.monthlyRevenue);

  const displayTotalRevenue = isAmountVisible
    ? formatCurrency(metrics.totalRevenue).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(metrics.totalRevenue);

  return (
    <div className="mb-8 lg:mb-12">
      <div className="relative overflow-hidden rounded-md p-6 text-primary-foreground shadow-lg transition-transform hover:scale-105 bg-primary max-w-md mx-auto">
        {/* Card background pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10 bg-primary-foreground" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full opacity-10 bg-primary-foreground" />

        {/* Toggle eye button */}
        <button
          onClick={toggleVisibility}
          className="absolute top-4 right-4 flex justify-center items-center transition-colors z-20 hover:bg-primary-foreground/10"
          aria-label={isAmountVisible ? "Hide amounts" : "Show amounts"}
        >
          {isAmountVisible ? (
            <EyeOff className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Eye className="w-4 h-4 text-primary-foreground" />
          )}
        </button>

        {/* Card content */}
        <div className="relative z-10 text-left">
          {/* Revenue icon above text */}
          <div className="flex justify-start mb-3">
            <TrendingUp className="w-8 h-8 text-primary-foreground/60" />
          </div>
          <p className="text-base lg:text-lg font-semibold text-primary-foreground/90 mb-2">
            This Month
          </p>
          <div className="mb-4">
            {/* Free users: Show only current month count */}
            {/* Premium users: Show revenue and count */}
            {isPremium ? (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {displayMonthlyRevenue}
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  Revenue of {metrics.monthlyInvoiceCount} invoices
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {metrics.monthlyInvoiceCount} invoices
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  Created this month
                </p>
              </>
            )}
          </div>

          {/* Total Revenue & Invoice Count Section - Premium only shows full data */}
          <div className="border-t border-primary-foreground/20 pt-3">
            {isPremium ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-primary-foreground/80">
                    Total Revenue
                  </span>
                  <span className="text-sm font-medium text-primary-foreground/80">
                    {displayTotalRevenue}
                  </span>
                </div>
                {/* <div className="flex items-center justify-between">
                  <span className="text-xs text-primary-foreground/80">
                    Total Invoices
                  </span>
                  <span className="text-sm font-medium text-primary-foreground/80">
                    {metrics.invoiceCount}
                  </span>
                </div> */}
              </>
            ) : (
              /* Free users: Show locked premium data teaser */
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-primary-foreground/10 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary-foreground/60" />
                  <span className="text-xs text-primary-foreground/80">
                    Total Revenue & Stats
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-xs font-medium text-primary-foreground/90 group-hover:text-primary-foreground">
                    Premium
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Invoice Limit Section */}
          {subscriptionStatus && (
            <div className="border-t border-primary-foreground/20 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-foreground/60" />
                  <span className="text-xs text-primary-foreground/80">
                    Invoice Limit
                  </span>
                </div>
                <span className="text-sm font-medium text-primary-foreground/80">
                  {subscriptionStatus.remainingInvoices} /{" "}
                  {subscriptionStatus.invoiceLimit}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-foreground/60 transition-all duration-300"
                  style={{
                    width: `${
                      ((subscriptionStatus.invoiceLimit -
                        subscriptionStatus.remainingInvoices) /
                        subscriptionStatus.invoiceLimit) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal for Free Users */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Dashboard Totals & Revenue"
        featureDescription="View your total revenue, invoice count, and detailed business statistics."
      />
    </div>
  );
}
