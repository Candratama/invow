"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/ui/feature-gate";
import {
  getAvailableReportMonthsAction,
  getMonthlyReportAction,
  isPremiumAction,
} from "@/app/actions/subscription";
import type { MonthlyReportSummary } from "@/lib/db/services/monthly-report.service";

interface ReportsTabProps {
  onClose: () => void;
}

/**
 * Reports Tab Component
 * Shows monthly reports for premium users, disabled state for free users
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export function ReportsTab({ onClose }: ReportsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [report, setReport] = useState<MonthlyReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch premium status and available months on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const premiumResult = await isPremiumAction();
        setIsPremium(premiumResult.data || false);

        if (premiumResult.data) {
          const monthsResult = await getAvailableReportMonthsAction();
          if (monthsResult.data) {
            setAvailableMonths(monthsResult.data);
            if (monthsResult.data.length > 0) {
              setSelectedMonth(monthsResult.data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch report when month changes
  useEffect(() => {
    if (!selectedMonth || !isPremium) return;

    startTransition(async () => {
      setError(null);
      const result = await getMonthlyReportAction(selectedMonth);
      if (result.error) {
        setError(
          result.error instanceof Error
            ? result.error.message
            : String(result.error)
        );
        setReport(null);
      } else {
        setReport(result.data);
      }
    });
  }, [selectedMonth, isPremium]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // Handle PDF download (generates a simple text-based report)
  const handleDownloadPDF = () => {
    if (!report) return;

    // Create report content
    const content = `
MONTHLY INVOICE REPORT
${report.monthDisplay}
Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}

SUMMARY
-------
Total Invoices: ${report.totalInvoices}
Total Revenue: ${formatCurrency(report.totalRevenue)}
Average Invoice: ${formatCurrency(report.averageInvoiceValue)}
Highest Invoice: ${formatCurrency(report.highestInvoice)}
Lowest Invoice: ${formatCurrency(report.lowestInvoice)}
Unique Customers: ${report.uniqueCustomers}

REVENUE BY CUSTOMER TYPE
------------------------
Distributor: ${formatCurrency(report.revenueByCustomerStatus.distributor)} (${
      report.invoicesByCustomerStatus.distributor
    } invoices)
Reseller: ${formatCurrency(report.revenueByCustomerStatus.reseller)} (${
      report.invoicesByCustomerStatus.reseller
    } invoices)
Customer: ${formatCurrency(report.revenueByCustomerStatus.customer)} (${
      report.invoicesByCustomerStatus.customer
    } invoices)

TOP CUSTOMERS
-------------
${report.topCustomers
  .map(
    (c, i) =>
      `${i + 1}. ${c.name}: ${formatCurrency(c.totalRevenue)} (${
        c.invoiceCount
      } invoices)`
  )
  .join("\n")}

${
  report.trend
    ? `
TREND VS PREVIOUS MONTH
-----------------------
Revenue Change: ${report.trend.revenueChange > 0 ? "+" : ""}${
        report.trend.revenueChange
      }%
Invoice Count Change: ${report.trend.invoiceCountChange > 0 ? "+" : ""}${
        report.trend.invoiceCountChange
      }%
`
    : ""
}
    `.trim();

    // Create and download file
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-report-${report.monthYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  // Locked state for free users
  const LockedContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 lg:py-8">
        <div className="lg:max-w-3xl lg:mx-auto">
          <div className="rounded-lg border bg-card p-6 sm:p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Monthly Reports</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get detailed monthly reports of your invoicing activity, including
              revenue trends, customer insights, and performance metrics.
            </p>
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full shadow-md w-fit mx-auto">
              <Lock className="w-3.5 h-3.5" />
              <span>Premium Feature</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4 lg:p-6 shadow-lg z-10">
        <div className="flex gap-2 sm:gap-3 lg:max-w-3xl lg:mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px]"
            size="lg"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <FeatureGate
      feature="hasMonthlyReport"
      hasAccess={isPremium}
      fallback={<LockedContent />}
      showBadge={false}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 space-y-4 sm:space-y-6 lg:py-8">
          <div className="lg:max-w-3xl lg:mx-auto space-y-4 sm:space-y-6">
            {/* Month Selector */}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Monthly Reports
              </h2>
              <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <label htmlFor="month-select" className="text-sm font-medium">
                    Select Month
                  </label>
                </div>

                {availableMonths.length > 0 ? (
                  <select
                    id="month-select"
                    value={selectedMonth || ""}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white min-h-[44px]"
                    disabled={isPending}
                  >
                    {availableMonths.map((month) => {
                      const [year, m] = month.split("-");
                      const date = new Date(parseInt(year), parseInt(m) - 1, 1);
                      const display = date.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <option key={month} value={month}>
                          {display}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No completed months with invoices yet. Reports will be
                    available at the start of next month.
                  </p>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isPending && (
              <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
                <p className="text-muted-foreground">Loading report...</p>
              </div>
            )}

            {/* Report Content */}
            {report && !isPending && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">
                        Invoices
                      </span>
                    </div>
                    <p className="text-xl font-bold">{report.totalInvoices}</p>
                  </div>

                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        Revenue
                      </span>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCurrency(report.totalRevenue)}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-muted-foreground">
                        Avg Invoice
                      </span>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCurrency(report.averageInvoiceValue)}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-muted-foreground">
                        Customers
                      </span>
                    </div>
                    <p className="text-xl font-bold">
                      {report.uniqueCustomers}
                    </p>
                  </div>
                </div>

                {/* Trend */}
                {report.trend && (
                  <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      {report.trend.isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      Trend vs Previous Month
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Revenue Change
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            report.trend.revenueChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {report.trend.revenueChange > 0 ? "+" : ""}
                          {report.trend.revenueChange}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Invoice Count Change
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            report.trend.invoiceCountChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {report.trend.invoiceCountChange > 0 ? "+" : ""}
                          {report.trend.invoiceCountChange}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue by Customer Type */}
                <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">
                    Revenue by Customer Type
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Distributor",
                        revenue: report.revenueByCustomerStatus.distributor,
                        count: report.invoicesByCustomerStatus.distributor,
                        color: "bg-blue-500",
                      },
                      {
                        label: "Reseller",
                        revenue: report.revenueByCustomerStatus.reseller,
                        count: report.invoicesByCustomerStatus.reseller,
                        color: "bg-green-500",
                      },
                      {
                        label: "Customer",
                        revenue: report.revenueByCustomerStatus.customer,
                        count: report.invoicesByCustomerStatus.customer,
                        color: "bg-orange-500",
                      },
                    ].map((item) => {
                      const percentage =
                        report.totalRevenue > 0
                          ? (item.revenue / report.totalRevenue) * 100
                          : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.label}</span>
                            <span className="font-medium">
                              {formatCurrency(item.revenue)} ({item.count})
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Customers */}
                {report.topCustomers.length > 0 && (
                  <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-semibold mb-3">
                      Top Customers
                    </h3>
                    <div className="space-y-2">
                      {report.topCustomers.map((customer, index) => (
                        <div
                          key={customer.name}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-sm">{customer.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(customer.totalRevenue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.invoiceCount} invoices
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                  <Button
                    onClick={handleDownloadPDF}
                    className="w-full gap-2 min-h-[44px]"
                    size="lg"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Download as text file
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4 lg:p-6 shadow-lg z-10">
          <div className="flex gap-2 sm:gap-3 lg:max-w-3xl lg:mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 min-h-[44px]"
              size="lg"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
