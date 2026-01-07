"use client";

import { useState, useTransition, lazy, useEffect, useCallback } from "react";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Static empty state UI - minimal client-side component.
 * This is the "hole" content that displays when there are no invoices.
 * The static content is kept minimal to reduce client JS bundle size.
 */
function EmptyStateUI() {
  return (
    <div className="max-w-sm mx-auto">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus className="text-primary" size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No invoices yet
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Create your first invoice to start tracking your sales and revenue
      </p>
    </div>
  );
}
import { FABButton } from "@/components/ui/fab-button";
import FinancialCards from "@/components/features/dashboard/financial-cards";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceCard } from "@/components/features/dashboard/invoice-card";
import { WelcomeBanner } from "@/components/features/onboarding/welcome-banner";
import { Button } from "@/components/ui/button";
import { useInvoiceStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/auth-context";
import { Invoice } from "@/lib/types";
import { ExpiryBanner } from "@/components/features/subscription/expiry-banner";
import { usePremiumStatus } from "@/lib/hooks/use-premium-status";
import { parseLocalDate } from "@/lib/utils";
import { generateJPEGFromInvoice } from "@/lib/utils/invoice-generator";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import { calculateFinancialMetrics } from "@/lib/utils/revenue";
import {
  useRevenueData,
  useInvoiceList,
  type DashboardData,
} from "@/lib/hooks/use-dashboard-data";
import { useInvalidateRelatedQueries } from "@/lib/hooks/use-invalidate-related";
import type { InvoiceWithItems } from "@/lib/db/services/invoices.service";
import type { InvoiceItem } from "@/lib/db/database.types";
import type { StoreSettings } from "@/lib/types";

// Lazy load heavy components
const InvoiceForm = lazy(() =>
  import("@/components/features/invoice/invoice-form").then((mod) => ({
    default: mod.InvoiceForm,
  }))
);
const InvoicePreview = lazy(() =>
  import("@/components/features/invoice/invoice-preview").then((mod) => ({
    default: mod.InvoicePreview,
  }))
);

interface DashboardClientProps {
  initialData: DashboardData | null;
}

/**
 * Dashboard Client Component - The "hole" in the donut pattern.
 *
 * This component contains all the interactive, user-specific functionality:
 * - View state management (home/form/preview)
 * - Invoice CRUD operations
 * - Keyboard shortcuts
 * - React Query data fetching
 * - Lazy-loaded heavy components (InvoiceForm, InvoicePreview)
 *
 * The static shell (header, layout) is cached in the parent layout.tsx
 * using the 'use cache' directive, while this component streams in
 * with the dynamic content.
 *
 * Optimizations applied:
 * - Lazy loading for InvoiceForm and InvoicePreview
 * - Memoized callbacks with useCallback
 * - Separate queries for revenue (static) and invoices (paginated)
 * - Minimal static UI extracted to EmptyStateUI
 */

function PreviewView({
  onBack,
  onComplete,
  storeSettings,
  tier = "free",
}: {
  onBack: () => void;
  onComplete: () => void;
  storeSettings: StoreSettings | null;
  tier?: string;
}) {
  const { currentInvoice, saveCompleted } = useInvoiceStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadJPEG = async () => {
    if (!currentInvoice || !currentInvoice.id) return;

    setIsGenerating(true);

    try {
      if (currentInvoice.id) {
        const result = await saveCompleted();
        if (!result.success) {
          toast.error(result.error || "Failed to save invoice");
          setIsGenerating(false);
          return;
        }
      }

      await generateJPEGFromInvoice(
        currentInvoice as Invoice,
        storeSettings ?? null
      );

      onComplete();
    } catch (error) {
      console.error("Error generating JPEG:", error);
      toast.error("Failed to generate JPEG. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No invoice to preview</p>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
            Preview
          </h1>
          <div className="w-16" />
        </div>
      </header>
      <InvoicePreview
        invoice={currentInvoice as Invoice}
        storeSettings={storeSettings ?? null}
        onDownloadJPEG={handleDownloadJPEG}
        isGenerating={isGenerating}
        tier={tier}
      />
    </>
  );
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [view, setView] = useState<"home" | "form" | "preview">("home");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const { user, loading: authLoading } = useAuth();
  const userEmail = user?.email || "";

  // Get premium status for expiry banner
  const { isPremium, daysUntilExpiry } = usePremiumStatus();

  const { initializeNewInvoice, loadCompleted } = useInvoiceStore();
  const { afterInvoiceMutation } = useInvalidateRelatedQueries();

  // Separate queries for revenue (static) and invoices (paginated)
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    isRefetching: isRefetchingRevenue,
    error: revenueError,
  } = useRevenueData(initialData || undefined);
  const {
    data: invoiceData,
    isLoading: isLoadingInvoices,
    isRefetching: isRefetchingInvoices,
    error: invoiceError,
  } = useInvoiceList(currentPage, initialData || undefined);

  // Show error toast when error occurs but cached data exists - Requirements: 3.4
  useEffect(() => {
    if (revenueError && revenueData) {
      toast.error("Failed to refresh data", {
        description: "Showing cached data. Pull to refresh or try again later.",
      });
    }
  }, [revenueError, revenueData]);

  useEffect(() => {
    if (invoiceError && invoiceData) {
      toast.error("Failed to refresh invoices", {
        description: "Showing cached data. Pull to refresh or try again later.",
      });
    }
  }, [invoiceError, invoiceData]);

  // Extract data from query results (safe even if undefined)
  const invoices = (invoiceData?.invoices || []) as InvoiceWithItems[];
  const totalPages = invoiceData?.totalPages || 1;
  const hasMoreHistory = invoiceData?.hasMoreHistory || false;
  const historyLimitMessage = invoiceData?.historyLimitMessage;

  const subscriptionStatus = revenueData?.subscriptionStatus || null;
  const storeSettings = revenueData?.storeSettings as StoreSettings | null;
  const defaultStore = revenueData?.defaultStore || null;
  const userPreferences = revenueData?.userPreferences || {
    selectedTemplate: "simple",
    taxEnabled: false,
    taxPercentage: 0,
  };

  // Transform all invoices with items from database format to Invoice type for metrics calculation
  const allInvoicesWithItems = (revenueData?.allInvoices ||
    []) as InvoiceWithItems[];
  const transformedInvoices: Invoice[] = allInvoicesWithItems.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    invoiceDate: parseLocalDate(inv.invoice_date),
    dueDate: parseLocalDate(inv.invoice_date),
    customer: {
      name: inv.customer_name,
      email: inv.customer_email || "",
      status:
        (inv.customer_status as "Distributor" | "Reseller" | "Customer") ||
        "Customer",
      address: inv.customer_address || "",
    },
    items:
      inv.invoice_items?.map((item: InvoiceItem) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        // Include buyback fields (will be undefined until migration is run)
        is_buyback: (item as any).is_buyback,
        gram: (item as any).gram,
        buyback_rate: (item as any).buyback_rate,
        total: (item as any).total,
      })) || [],
    subtotal: inv.subtotal,
    shippingCost: inv.shipping_cost,
    total: inv.total,
    note: inv.note || undefined,
    status: (inv.status === "synced" ? "completed" : inv.status) as
      | "completed"
      | "draft"
      | "pending", // Map synced to completed
    createdAt: new Date(inv.created_at),
    updatedAt: new Date(inv.updated_at),
    syncedAt: inv.synced_at ? new Date(inv.synced_at) : undefined,
  }));

  // Calculate financial metrics from all invoices
  const financialMetrics = calculateFinancialMetrics(transformedInvoices);

  // Transform paginated invoices for display
  const completedInvoices =
    invoices?.map((inv: InvoiceWithItems) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      invoiceDate: parseLocalDate(inv.invoice_date),
      dueDate: parseLocalDate(inv.invoice_date),
      customer: {
        name: inv.customer_name,
        email: inv.customer_email || "",
        status:
          (inv.customer_status as "Distributor" | "Reseller" | "Customer") ||
          "Customer",
        address: inv.customer_address || "",
      },
      items: inv.invoice_items.map((item: InvoiceItem) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        // Include buyback fields for icon detection
        is_buyback: (item as any).is_buyback,
        gram: (item as any).gram,
        buyback_rate: (item as any).buyback_rate,
        total: (item as any).total,
      })),
      subtotal: inv.subtotal,
      shippingCost: inv.shipping_cost,
      total: inv.total,
      note: inv.note || undefined,
      status: (inv.status === "synced" ? "completed" : inv.status) as
        | "completed"
        | "draft"
        | "pending", // Map synced to completed for display
      createdAt: new Date(inv.created_at),
      updatedAt: new Date(inv.updated_at),
      syncedAt: inv.synced_at ? new Date(inv.synced_at) : undefined,
    })) || [];

  const handleNewInvoice = useCallback(() => {
    initializeNewInvoice();
    setView("form");
  }, [initializeNewInvoice]);

  const handleOpenCompleted = useCallback(
    async (invoiceId: string) => {
      await loadCompleted(invoiceId);
      setView("form");
    },
    [loadCompleted]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N = New Invoice
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && view === "home") {
        e.preventDefault();
        if (defaultStore) handleNewInvoice();
      }
      // Escape = Back to home
      if (e.key === "Escape" && view !== "home") {
        e.preventDefault();
        setView("home");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, defaultStore, handleNewInvoice]);

  // Show skeleton ONLY when auth is loading or initial data fetch with no cache
  // Requirements: 1.1, 1.5, 2.5, 3.2
  if (authLoading || (isLoadingRevenue && !revenueData)) {
    return <DashboardSkeleton />;
  }

  // Determine if we're refetching in background (for subtle indicator)
  const isBackgroundRefetching =
    (isRefetchingRevenue && revenueData) ||
    (isRefetchingInvoices && invoiceData);

  const handleDeleteCompleted = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    if (confirm("Delete this invoice?")) {
      startTransition(async () => {
        const result = await deleteInvoiceAction(invoiceId);
        if (result.success) {
          afterInvoiceMutation(defaultStore?.id);
          toast.success("Invoice deleted", {
            description: "The invoice has been removed from your records",
          });
        } else {
          toast.error("Failed to delete", {
            description: result.error || "Please try again",
          });
        }
      });
    }
  };

  const handleInvoiceComplete = () => {
    // Invalidate cache after creating/updating invoice (including customers cache for new customers)
    afterInvoiceMutation(defaultStore?.id);
    setView("home");
  };

  if (view === "form") {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setView("home")}
              className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
              New Invoice
            </h1>
            <div className="w-16" />
          </div>
        </header>
        <InvoiceForm
          onComplete={handleInvoiceComplete}
          subscriptionStatus={subscriptionStatus}
          storeSettings={storeSettings}
          defaultStore={defaultStore}
          initialTaxEnabled={userPreferences.taxEnabled}
          initialTaxPercentage={userPreferences.taxPercentage}
          initialSelectedTemplate={userPreferences.selectedTemplate}
        />
      </div>
    );
  }

  if (view === "preview") {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 animate-in fade-in slide-in-from-right-4 duration-200">
        <PreviewView
          onBack={() => setView("form")}
          onComplete={handleInvoiceComplete}
          storeSettings={storeSettings}
          tier={subscriptionStatus?.tier}
        />
      </div>
    );
  }

  return (
    <>
      <PaymentSuccessHandler />

      {/* Subtle background refetch indicator - Requirements: 2.5, 3.2 */}
      {isBackgroundRefetching && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20 overflow-hidden">
          <div
            className="h-full w-1/3 bg-primary animate-pulse"
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          />
        </div>
      )}

      <main className="pb-24 px-4 lg:px-6 lg:pb-8">
        <div className="max-w-md lg:max-w-6xl mx-auto pt-8 ">
          <div className="text-center mb-8 lg:mb-12">
            <p className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              Welcome back,
              {userEmail
                ? ` ${userEmail
                    .split("@")[0]
                    .split(".")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}`
                : ""}
              ! 👋
            </p>
          </div>

          <WelcomeBanner
            userName={userEmail}
            hasBusinessInfo={
              !!storeSettings?.name &&
              !!storeSettings?.address &&
              !!storeSettings?.whatsapp
            }
          />

          {/* Subscription Expiry Banner for Premium Users */}
          {isPremium && <ExpiryBanner daysUntilExpiry={daysUntilExpiry} />}

          <FinancialCards
            metrics={financialMetrics}
            subscriptionStatus={subscriptionStatus}
            isLoading={isLoadingRevenue}
          />

          {/* Subscription quota display - 2-row layout */}
          {subscriptionStatus && (
            <div className="mt-6 lg:mt-8 mb-6 lg:mb-8 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              {/* Title */}
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">
                Subscription Quota
              </h3>

              {/* Row 1: Progress bar & Credit left */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        (subscriptionStatus.currentMonthCount /
                          subscriptionStatus.invoiceLimit) *
                          100 >=
                        90
                          ? "bg-red-500"
                          : (subscriptionStatus.currentMonthCount /
                              subscriptionStatus.invoiceLimit) *
                              100 >=
                            70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (subscriptionStatus.currentMonthCount /
                            subscriptionStatus.invoiceLimit) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">
                  <span
                    className={
                      subscriptionStatus.remainingInvoices <= 5
                        ? "text-red-600"
                        : subscriptionStatus.remainingInvoices <= 20
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {subscriptionStatus.remainingInvoices} left
                  </span>
                </div>
              </div>

              {/* Row 2: Expired date & Invoice count */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div>
                  {subscriptionStatus.resetDate && (
                    <span>
                      {subscriptionStatus.tier === "premium"
                        ? "Expires"
                        : "Resets"}{" "}
                      on{" "}
                      <span className="font-medium text-gray-700">
                        {(() => {
                          const date = new Date(subscriptionStatus.resetDate);
                          const months = [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                          ];
                          return `${
                            months[date.getMonth()]
                          } ${date.getDate()}, ${date.getFullYear()}`;
                        })()}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      subscriptionStatus.tier === "premium"
                        ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {subscriptionStatus.tier === "premium"
                      ? "⚡ Premium"
                      : "🎁 Free"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <>
            {/* Show skeleton only when loading AND no cached data - Requirements: 1.1, 1.5 */}
            {isLoadingInvoices && !invoiceData ? (
              <InvoicesListSkeleton />
            ) : isPending ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <Loader2
                  className="animate-spin mx-auto mb-2 text-primary"
                  size={24}
                />
                <p className="text-gray-500">Updating...</p>
              </div>
            ) : completedInvoices.length > 0 ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:p-8">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                  Your Invoices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
                  {completedInvoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onOpen={handleOpenCompleted}
                      onDelete={handleDeleteCompleted}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}

                {hasMoreHistory && historyLimitMessage && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-sm text-amber-800">
                      {historyLimitMessage}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center lg:p-12">
                {/* Static empty state content - could be server-rendered */}
                <EmptyStateUI />
                {defaultStore && (
                  <Button onClick={handleNewInvoice} className="gap-2">
                    <Plus size={18} />
                    Create First Invoice
                  </Button>
                )}
              </div>
            )}
          </>
        </div>
      </main>

      <div className="lg:hidden">
        <FABButton onClick={handleNewInvoice} disabled={!defaultStore} />
      </div>

      <div className="hidden lg:block fixed bottom-8 right-8 z-40">
        <button
          onClick={handleNewInvoice}
          disabled={!defaultStore}
          title={
            defaultStore ? "New Invoice (Ctrl+N)" : "Set up Business Info first"
          }
          className={`bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2 font-medium ${
            !defaultStore
              ? "opacity-50 cursor-not-allowed hover:bg-primary"
              : ""
          }`}
        >
          <Plus size={20} />
          New Invoice
        </button>
      </div>
    </>
  );
}
