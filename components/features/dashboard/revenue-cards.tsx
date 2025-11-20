import { useState } from "react";
import { Eye, EyeOff, TrendingUp, FileText } from "lucide-react";
import { RevenueMetrics } from "@/lib/utils/revenue";
import { formatCurrency } from "@/lib/utils";
import { RevenueCardSkeleton } from "@/components/skeletons/revenue-card-skeleton";

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

export function RevenueCards({ metrics, subscriptionStatus, isLoading = false }: RevenueCardsProps) {
  const [isAmountVisible, setIsAmountVisible] = useState(true);

  // Show skeleton when loading
  if (isLoading) {
    return <RevenueCardSkeleton />;
  }

  const toggleVisibility = () => {
    setIsAmountVisible(!isAmountVisible);
  };

  const displayMonthlyRevenue = isAmountVisible
    ? formatCurrency(metrics.monthlyRevenue).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(metrics.monthlyRevenue);

  const displayTotalRevenue = isAmountVisible
    ? formatCurrency(metrics.totalRevenue).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(metrics.totalRevenue);

  return (
    <div className="mb-8 lg:mb-12">
      <div className="relative overflow-hidden rounded-xl p-6 text-primary-foreground shadow-lg transition-transform hover:scale-105 bg-primary max-w-md mx-auto">
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
          <p className="text-sm font-medium text-primary-foreground/80 mb-2">
            This Month
          </p>
          <div className="mb-4">
            <h3 className="text-3xl lg:text-4xl font-bold mb-1">
              {displayMonthlyRevenue}
            </h3>
            <p className="text-sm text-primary-foreground/80">
              Revenue of {metrics.monthlyInvoiceCount} invoices
            </p>
          </div>

          <div className="border-t border-primary-foreground/20 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary-foreground/80">
                Total Revenue
              </span>
              <span className="text-sm font-medium text-primary-foreground/80">
                {displayTotalRevenue}
              </span>
            </div>
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
                  {subscriptionStatus.remainingInvoices} / {subscriptionStatus.invoiceLimit}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-foreground/60 transition-all duration-300"
                  style={{
                    width: `${((subscriptionStatus.invoiceLimit - subscriptionStatus.remainingInvoices) / subscriptionStatus.invoiceLimit) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
