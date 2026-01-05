"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { FinancialMetrics } from "@/lib/utils/revenue";
import { formatCurrency } from "@/lib/utils";

interface FinancialCardsProps {
  metrics: FinancialMetrics;
  subscriptionStatus: {
    tier: string;
  } | null;
  isLoading?: boolean;
}

function formatCurrencyWithDots(amount: number): string {
  const formatted = formatCurrency(amount);
  const normalizedFormatted = formatted.replace(/[\u00A0\s]+/, " ");
  const rpMatch = normalizedFormatted.match(/^Rp\s?(.+)$/);
  if (rpMatch) {
    const number = rpMatch[1];
    return `Rp ${"*".repeat(number.replace(/\s/g, "").length)}`;
  }
  return formatted;
}

interface CardProps {
  metrics: FinancialMetrics;
  isPremium: boolean;
  isVisible: boolean;
}

function SalesRevenueCard({ metrics, isPremium, isVisible }: CardProps) {
  const { sales } = metrics;

  return (
    <div className="w-[90%] flex-shrink-0 snap-center lg:w-auto lg:min-w-0">
      <div className="relative bg-gradient-to-br from-amber-400 to-yellow-600 text-white rounded-lg p-6 shadow-lg hover:scale-[1.02] transition-transform overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        {/* Content */}
        <div className="relative z-10">
          <TrendingUp className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90">Sales Revenue</p>

          {isPremium ? (
            <>
              <h3 className="text-3xl font-bold mt-2">
                {isVisible
                  ? formatCurrency(sales.monthlyRevenue)
                  : formatCurrencyWithDots(sales.monthlyRevenue)}
              </h3>
              <p className="text-sm mt-1 opacity-80">
                {sales.monthlyInvoiceCount} invoices this month
              </p>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold mt-2">
                {sales.monthlyInvoiceCount}
              </h3>
              <p className="text-sm mt-1 opacity-80">invoices this month</p>
            </>
          )}

          <div className="border-t border-white/20 pt-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="opacity-80">Total Revenue</span>
              <span>
                {isPremium
                  ? isVisible
                    ? formatCurrency(sales.totalRevenue)
                    : formatCurrencyWithDots(sales.totalRevenue)
                  : `${sales.invoiceCount} invoices`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuybackExpensesCard({ metrics, isPremium, isVisible }: CardProps) {
  const { buyback } = metrics;

  return (
    <div className="w-[90%] flex-shrink-0 snap-center lg:w-auto lg:min-w-0">
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg hover:scale-[1.02] transition-transform overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        {/* Content */}
        <div className="relative z-10">
          <ShoppingCart className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90">Buyback Expenses</p>

          {isPremium ? (
            <>
              <h3 className="text-3xl font-bold mt-2">
                {isVisible
                  ? formatCurrency(buyback.monthlyExpenses)
                  : formatCurrencyWithDots(buyback.monthlyExpenses)}
              </h3>
              <p className="text-sm mt-1 opacity-80">
                {buyback.monthlyInvoiceCount} purchases this month
              </p>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold mt-2">
                {buyback.monthlyInvoiceCount}
              </h3>
              <p className="text-sm mt-1 opacity-80">purchases this month</p>
            </>
          )}

          <div className="border-t border-white/20 pt-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="opacity-80">Total Expenses</span>
              <span>
                {isPremium
                  ? isVisible
                    ? formatCurrency(buyback.totalExpenses)
                    : formatCurrencyWithDots(buyback.totalExpenses)
                  : `${buyback.invoiceCount} purchases`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialCards({
  metrics,
  subscriptionStatus,
  isLoading = false,
}: FinancialCardsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const isPremium = subscriptionStatus?.tier === "premium";

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (isLoading) {
    return (
      <div className="mb-8 lg:mb-12">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[280px] snap-center lg:min-w-0">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 h-48 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 lg:mb-12">
      {/* Eye toggle button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleVisibility}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
          aria-label={isVisible ? "Hide amounts" : "Show amounts"}
        >
          {isVisible ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Hide amounts</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Show amounts</span>
            </>
          )}
        </button>
      </div>

      {/* Cards container - mobile: horizontal scroll, desktop: 2-column grid */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible">
        <SalesRevenueCard
          metrics={metrics}
          isPremium={isPremium}
          isVisible={isVisible}
        />
        <BuybackExpensesCard
          metrics={metrics}
          isPremium={isPremium}
          isVisible={isVisible}
        />
      </div>

      {/* Scroll indicators - mobile only */}
      <div className="flex justify-center gap-2 mt-4 lg:hidden">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
    </div>
  );
}
