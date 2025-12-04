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
import { RevenueCards } from "@/components/features/dashboard/revenue-cards";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceCard } from "@/components/features/dashboard/invoice-card";
import { WelcomeBanner } from "@/components/features/onboarding/welcome-banner";
import { Button } from "@/components/ui/button";
import { useInvoiceStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/auth-context";
import { Invoice } from "@/lib/types";
import { parseLocalDate } from "@/lib/utils";
import { generateJPEGFromInvoice } from "@/lib/utils/invoice-generator";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import {
  useRevenueData,
  useInvoiceList,
  useInvalidateDashboard,
  type DashboardData,
} from "@/lib/hooks/use-dashboard-data";
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
  const [view, setView] = useState<"home" | "form" | "preview">("home");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const { user } = useAuth();
  const userEmail = user?.email || "";

  const { initializeNewInvoice, loadCompleted } = useInvoiceStore();
  const invalidateDashboard = useInvalidateDashboard();

  // Separate queries for revenue (static) and invoices (paginated)
  const { data: revenueData, isLoading: isLoadingRevenue } = useRevenueData(
    initialData || undefined
  );
  const { data: invoiceData, isLoading: isLoadingInvoices } = useInvoiceList(
    currentPage,
    initialData || undefined
  );

  // Extract data from query results
  const invoices = (invoiceData?.invoices || []) as InvoiceWithItems[];
  const totalPages = invoiceData?.totalPages || 1;
  const hasMoreHistory = invoiceData?.hasMoreHistory || false;
  const historyLimitMessage = invoiceData?.historyLimitMessage;

  const revenueMetrics = revenueData?.revenueMetrics || {
    totalRevenue: 0,
    monthlyRevenue: 0,
    invoiceCount: 0,
    monthlyInvoiceCount: 0,
    averageOrderValue: 0,
    monthlyAverageOrderValue: 0,
  };
  const subscriptionStatus = revenueData?.subscriptionStatus || null;
  const storeSettings = revenueData?.storeSettings as StoreSettings | null;
  const defaultStore = revenueData?.defaultStore || null;

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
      })),
      subtotal: inv.subtotal,
      shippingCost: inv.shipping_cost,
      total: inv.total,
      note: inv.note || undefined,
      status: "completed" as const,
      createdAt: new Date(inv.created_at),
      updatedAt: new Date(inv.updated_at),
      syncedAt: inv.synced_at ? new Date(inv.synced_at) : undefined,
    })) || [];

  const handleNewInvoice = useCallback(() => {
    initializeNewInvoice();
    setView("form");
  }, [initializeNewInvoice]);

  const handleOpenCompleted = async (invoiceId: string) => {
    await loadCompleted(invoiceId);
    setView("form");
  };

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

  const handleDeleteCompleted = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    if (confirm("Delete this invoice?")) {
      startTransition(async () => {
        const result = await deleteInvoiceAction(invoiceId);
        if (result.success) {
          invalidateDashboard();
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
    // Invalidate cache after creating/updating invoice
    invalidateDashboard();
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

      <main className="pb-24 px-4 lg:px-6 lg:pb-8">
        <div className="max-w-md lg:max-w-2xl mx-auto pt-8 ">
          <div className="text-left mb-8 lg:mb-12 lg:text-center">
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

          <RevenueCards
            metrics={revenueMetrics}
            subscriptionStatus={subscriptionStatus}
            isLoading={isLoadingRevenue}
          />

          <>
            {isLoadingInvoices ? (
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
              <div className="bg-white p-6 rounded-lg shadow-sm lg:p-8">
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
