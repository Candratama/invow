"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Receipt, Eye, EyeOff } from "lucide-react";
import { invoicesService } from "@/lib/db/services";
import { useAuth } from "@/lib/auth/auth-context";
import { useStore } from "@/lib/store";

interface RevenueData {
  monthlyRevenue: number;
  totalRevenue: number;
  count: number;
  isLoading: boolean;
  error: string | null;
}

export function RevenueCard() {
  const { user } = useAuth();
  const completedInvoices = useStore((state) => state.completedInvoices);
  const [revenue, setRevenue] = useState<RevenueData>({
    monthlyRevenue: 0,
    totalRevenue: 0,
    count: 0,
    isLoading: true,
    error: null,
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!user) {
      setRevenue({
        monthlyRevenue: 0,
        totalRevenue: 0,
        count: 0,
        isLoading: false,
        error: null,
      });
      return;
    }

    const fetchRevenue = async () => {
      setRevenue((prev) => ({ ...prev, isLoading: true }));

      const { monthlyRevenue, totalRevenue, count, error } =
        await invoicesService.getRevenueStats();

      if (error) {
        setRevenue({
          monthlyRevenue: 0,
          totalRevenue: 0,
          count: 0,
          isLoading: false,
          error: error.message,
        });
      } else {
        setRevenue({
          monthlyRevenue,
          totalRevenue,
          count,
          isLoading: false,
          error: null,
        });
      }
    };

    fetchRevenue();
  }, [user, completedInvoices]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format currency with hidden amount (keep Rp visible)
  const formatHiddenCurrency = () => {
    return "Rp ••••••••";
  };

  if (!user) {
    return null;
  }

  if (revenue.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 lg:p-8">
        <div className="flex items-center gap-3 text-red-600">
          <TrendingUp size={24} />
          <div>
            <p className="font-semibold">Error Loading Revenue</p>
            <p className="text-sm text-red-500">{revenue.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/90 to-primary rounded-lg p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center lg:w-12 lg:h-12">
            <DollarSign size={20} className="lg:w-6 lg:h-6" />
          </div>
          <h3 className="text-base font-medium text-white/90 lg:text-lg">
            Revenue
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label={isVisible ? "Hide amounts" : "Show amounts"}
          >
            {isVisible ? (
              <Eye size={24} className="lg:w-5 lg:h-5" />
            ) : (
              <EyeOff size={24} className="lg:w-5 lg:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Revenue Amounts */}
      {revenue.isLoading ? (
        <div className="animate-pulse space-y-3">
          <div>
            <div className="h-4 bg-white/20 rounded w-24 mb-2"></div>
            <div className="h-10 bg-white/20 rounded w-3/4 lg:h-12"></div>
          </div>
          <div>
            <div className="h-3 bg-white/20 rounded w-20 mb-1"></div>
            <div className="h-6 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Monthly Revenue */}
          <div className="mb-4">
            <div className="text-sm text-white/70 mb-1 flex items-center gap-2">
              <TrendingUp size={14} />
              This Month
            </div>
            <div className="text-3xl font-bold lg:text-4xl">
              {isVisible
                ? formatCurrency(revenue.monthlyRevenue)
                : formatHiddenCurrency()}
            </div>
          </div>

          {/* Total Revenue & Invoice Count */}
          <div className="flex items-end justify-between">
            {/* Total Revenue */}
            <div>
              <div className="text-xs text-white/60 mb-1">Total All Time</div>
              <div className="text-lg font-semibold text-white/90 lg:text-xl">
                {isVisible
                  ? formatCurrency(revenue.totalRevenue)
                  : formatHiddenCurrency()}
              </div>
            </div>

            {/* Invoice Count */}
            <div className="flex items-center gap-2 text-white/70 text-right">
              <div className="text-xs lg:text-sm">
                {revenue.count}
                <br />
                {revenue.count === 1 ? "invoice" : "invoices"}
              </div>
              <Receipt size={32} className="opacity-70" />
            </div>
          </div>
        </>
      )}

      {/* Decorative Element */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="150" cy="50" r="100" fill="white" />
        </svg>
      </div>
    </div>
  );
}
