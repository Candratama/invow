"use client";

import { useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { InvoiceForm } from "@/components/features/invoice/invoice-form";
import { InvoicePreview } from "@/components/features/invoice/invoice-preview";
import { FABButton } from "@/components/ui/fab-button";
import { UserMenu } from "@/components/features/dashboard/user-menu";
import { RevenueCards } from "@/components/features/dashboard/revenue-cards";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceCard } from "@/components/features/dashboard/invoice-card";
import { useInvoiceStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/auth-context";
import { Invoice } from "@/lib/types";
import { parseLocalDate } from "@/lib/utils";
import { generateJPEGFromInvoice } from "@/lib/utils/invoice-generator";
import { calculateRevenueMetrics } from "@/lib/utils/revenue";
import {
  useAllInvoices,
  useInvoices,
  useSubscriptionStatus,
  useDeleteInvoice,
} from "@/lib/hooks/use-dashboard-data";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";

function PreviewView({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const { currentInvoice, saveCompleted } = useInvoiceStore();
  const { data: storeSettings } = useStoreSettings();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadJPEG = async () => {
    if (!currentInvoice || !currentInvoice.id) return;

    setIsGenerating(true);

    try {
      // Check subscription limit and save invoice
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

      // Notify completion
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
      />
    </>
  );
}

export default function HomePage() {
  const [view, setView] = useState<"home" | "form" | "preview">("home");
  const [currentPage, setCurrentPage] = useState(1);

  const { initializeNewInvoice, loadCompleted } = useInvoiceStore();

  // Get auth state
  const { user, loading: authLoading } = useAuth();

  // React Query hooks - automatic caching and background refetching
  const { data: allInvoicesData, isLoading: allInvoicesLoading } =
    useAllInvoices();
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    isError,
  } = useInvoices(currentPage, 10);
  const { data: subscriptionStatus } = useSubscriptionStatus();

  // Mutation hook for deleting invoices with optimistic updates
  const deleteInvoice = useDeleteInvoice();

  // Calculate revenue metrics from ALL invoices (not paginated)
  const allCompletedInvoices =
    allInvoicesData?.map((inv) => ({
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
      items: [], // Not needed for revenue calculation
      subtotal: inv.subtotal,
      shippingCost: inv.shipping_cost,
      total: inv.total,
      note: inv.note || undefined,
      status: "completed" as const,
      createdAt: new Date(inv.created_at),
      updatedAt: new Date(inv.updated_at),
      syncedAt: inv.synced_at ? new Date(inv.synced_at) : undefined,
    })) || [];

  const revenueMetrics = calculateRevenueMetrics(allCompletedInvoices);

  // Transform paginated invoices for display
  const completedInvoices =
    invoicesData?.invoices.map((inv) => ({
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
      items: inv.invoice_items.map((item) => ({
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

  const isLoading = invoicesLoading && !invoicesData;
  const isRevenueLoading = allInvoicesLoading && !allInvoicesData;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/login";
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleNewInvoice = () => {
    initializeNewInvoice();
    setView("form");
  };

  const handleOpenCompleted = (invoiceId: string) => {
    loadCompleted(invoiceId);
    setView("form");
  };

  const handleDeleteCompleted = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    if (confirm("Delete this invoice?")) {
      try {
        await deleteInvoice.mutateAsync(invoiceId);
        // Success - optimistic update already handled by the mutation hook
      } catch (error) {
        // Error message - rollback already handled by the mutation hook
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete invoice";
        toast.error(`Failed to delete invoice: ${errorMessage}`);
      }
    }
  };

  const handleInvoiceComplete = () => {
    setView("home");
  };

  if (view === "form") {
    return (
      <>
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
        <InvoiceForm onComplete={handleInvoiceComplete} />
      </>
    );
  }

  if (view === "preview") {
    return (
      <PreviewView
        onBack={() => setView("form")}
        onComplete={handleInvoiceComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payment Success/Failure Handler */}
      <PaymentSuccessHandler />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 px-4 lg:px-6 lg:pb-8">
        <div className="max-w-md lg:max-w-2xl mx-auto pt-8 ">
          <div className="text-left mb-8 lg:mb-12 lg:text-center">
            <p className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              Welcome back,
              {user?.email
                ? ` ${user.email
                    .split("@")[0]
                    .split(".")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}`
                : ""}
              ! 👋
            </p>
          </div>

          {/* Revenue Cards */}
          <RevenueCards
            metrics={revenueMetrics}
            subscriptionStatus={subscriptionStatus || null}
            isLoading={isRevenueLoading}
          />

          {/* Invoices List */}
          <>
            {isLoading ? (
              <InvoicesListSkeleton />
            ) : isError ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center lg:p-12">
                <p className="text-red-500">Failed to load invoices</p>
                <p className="text-sm text-gray-400 mt-1">
                  Please try refreshing the page
                </p>
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

                {/* Pagination */}
                {invoicesData && invoicesData.totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={invoicesData.totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center lg:p-12">
                <p className="text-gray-500">No invoices yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first invoice to get started
                </p>
              </div>
            )}
          </>
        </div>
      </main>

      {/* Floating Action Button - Mobile only, Desktop uses different approach */}
      <div className="lg:hidden">
        <FABButton onClick={handleNewInvoice} />
      </div>

      {/* Desktop: Fixed bottom-right button with better positioning */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-40">
        <button
          onClick={handleNewInvoice}
          className="bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          New Invoice
        </button>
      </div>
    </div>
  );
}
