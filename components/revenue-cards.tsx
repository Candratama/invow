import { useState } from "react";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { RevenueMetrics } from "@/lib/revenue-utils";
import { formatCurrency } from "@/lib/utils";

interface RevenueCardsProps {
  metrics: RevenueMetrics;
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

export function RevenueCards({ metrics }: RevenueCardsProps) {
  const [isAmountVisible, setIsAmountVisible] = useState(true);

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
        </div>
      </div>
    </div>
  );
}
