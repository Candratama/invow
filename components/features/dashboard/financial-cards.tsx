"use client";

import { useState, useRef } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  ChevronLeft,
  ChevronRight,
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
    <div className="min-w-[280px] lg:min-w-[320px] snap-center">
      <div className="relative bg-green-600 text-white rounded-lg p-6 shadow-lg hover:scale-[1.02] transition-transform overflow-hidden">
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
                {isVisible ? formatCurrency(sales.monthlyRevenue) : formatCurrencyWithDots(sales.monthlyRevenue)}
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
              <p className="text-sm mt-1 opacity-80">
                invoices this month
              </p>
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
                  : `${sales.invoiceCount} invoices`
                }
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
    <div className="min-w-[280px] lg:min-w-[320px] snap-center">
      <div className="relative bg-amber-600 text-white rounded-lg p-6 shadow-lg hover:scale-[1.02] transition-transform overflow-hidden">
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
                {isVisible ? formatCurrency(buyback.monthlyExpenses) : formatCurrencyWithDots(buyback.monthlyExpenses)}
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
              <p className="text-sm mt-1 opacity-80">
                purchases this month
              </p>
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
                  : `${buyback.invoiceCount} purchases`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetProfitCard({ metrics, isPremium, isVisible }: CardProps) {
  const { profit } = metrics;

  return (
    <div className="min-w-[280px] lg:min-w-[320px] snap-center">
      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg hover:scale-[1.02] transition-transform overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        {/* Content */}
        <div className="relative z-10">
          <DollarSign className="w-8 h-8 mb-3" />
          <p className="text-sm opacity-90">Net Profit</p>

          {isPremium ? (
            <>
              <h3 className="text-3xl font-bold mt-2">
                {isVisible ? formatCurrency(profit.monthlyNetProfit) : formatCurrencyWithDots(profit.monthlyNetProfit)}
              </h3>
              <p className="text-sm mt-1 opacity-80">
                {profit.profitMargin.toFixed(1)}% margin this month
              </p>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold mt-2">
                Premium Only
              </h3>
              <p className="text-sm mt-1 opacity-80">
                Upgrade to view profit
              </p>
            </>
          )}

          <div className="border-t border-white/20 pt-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="opacity-80">Total Profit</span>
              <span>
                {isPremium
                  ? isVisible
                    ? formatCurrency(profit.totalNetProfit)
                    : formatCurrencyWithDots(profit.totalNetProfit)
                  : "Premium Only"
                }
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPremium = subscriptionStatus?.tier === "premium";

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const scrollToCard = (index: number) => {
    if (containerRef.current) {
      const cardWidth = 280; // min-width on mobile
      const gap = 16; // gap-4 = 1rem = 16px
      const scrollPosition = index * (cardWidth + gap);

      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToCard(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < 2) {
      scrollToCard(currentIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8 lg:mb-12">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] lg:min-w-[320px] snap-center">
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

      {/* Cards container with navigation arrows */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Cards container - swipeable on all devices */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        >
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
          <NetProfitCard
            metrics={metrics}
            isPremium={isPremium}
            isVisible={isVisible}
          />
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={currentIndex === 2}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next card"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Scroll indicators */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => scrollToCard(0)}
          className={`w-2 h-2 rounded-full transition-colors ${
            currentIndex === 0 ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
          }`}
          aria-label="Go to Sales Revenue card"
        />
        <button
          onClick={() => scrollToCard(1)}
          className={`w-2 h-2 rounded-full transition-colors ${
            currentIndex === 1 ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
          }`}
          aria-label="Go to Buyback Expenses card"
        />
        <button
          onClick={() => scrollToCard(2)}
          className={`w-2 h-2 rounded-full transition-colors ${
            currentIndex === 2 ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
          }`}
          aria-label="Go to Net Profit card"
        />
      </div>
    </div>
  );
}
