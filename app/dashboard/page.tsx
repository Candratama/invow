"use client";

import { useState } from "react";
import { Trash2, Plus, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { InvoiceForm } from "@/components/features/invoice/invoice-form";
import { InvoicePreview } from "@/components/features/invoice/invoice-preview";
import { FABButton } from "@/components/ui/fab-button";
import { UserMenu } from "@/components/features/dashboard/user-menu";
import { RevenueCards } from "@/components/features/dashboard/revenue-cards";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { Pagination } from "@/components/ui/pagination";
import { useInvoiceStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/auth-context";
import { Invoice } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { generateJPEGFromInvoice } from "@/lib/utils/invoice-generator";
import { calculateRevenueMetrics } from "@/lib/utils/revenue";
import { useInvoices, useSubscriptionStatus, useDeleteInvoice } from "@/lib/hooks/use-dashboard-data";
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
          alert(result.error || "Failed to save invoice");
          setIsGenerating(false);
          return;
        }
      }

      await generateJPEGFromInvoice(currentInvoice as Invoice, storeSettings ?? null);

      // Notify completion
      onComplete();
    } catch (error) {
      console.error("Error generating JPEG:", error);
      alert("Failed to generate JPEG. Please try again.");
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
            className="text-primary font-medium hover:text-primary/80 transition-colors"
          >
            ← Back
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
  
  const {
    initializeNewInvoice,
    loadCompleted,
  } = useInvoiceStore();

  // Get auth state
  const { user, loading: authLoading } = useAuth();

  // React Query hooks - automatic caching and background refetching
  const { data: invoicesData, isLoading: invoicesLoading, isError } = useInvoices(currentPage, 10);
  const { data: subscriptionStatus } = useSubscriptionStatus();
  
  // Mutation hook for deleting invoices with optimistic updates
  const deleteInvoice = useDeleteInvoice();

  // Calculate revenue metrics from cached invoice data
  const completedInvoices = invoicesData?.invoices.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    invoiceDate: new Date(inv.invoice_date),
    dueDate: new Date(inv.invoice_date),
    customer: {
      name: inv.customer_name,
      email: inv.customer_email || "",
      status: (inv.customer_status as "Distributor" | "Reseller" | "Customer") || "Customer",
      address: inv.customer_address || ""
    },
    items: inv.invoice_items.map(item => ({
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
    status: 'completed' as const,
    createdAt: new Date(inv.created_at),
    updatedAt: new Date(inv.updated_at),
    syncedAt: inv.synced_at ? new Date(inv.synced_at) : undefined
  })) || [];

  const revenueMetrics = calculateRevenueMetrics(completedInvoices);
  const isLoading = invoicesLoading && !invoicesData;

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

  const handleDeleteCompleted = async (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    if (confirm("Delete this invoice?")) {
      try {
        await deleteInvoice.mutateAsync(invoiceId);
        // Success - optimistic update already handled by the mutation hook
      } catch (error) {
        // Error message - rollback already handled by the mutation hook
        const errorMessage = error instanceof Error ? error.message : "Failed to delete invoice";
        alert(`Failed to delete invoice: ${errorMessage}`);
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
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              ← Back
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
            <p className="font-semibold text-gray-900 mb-3 lg:text-xl lg:mb-4">
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
            isLoading={isLoading}
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
                <h3 className="font-semibold text-gray-900 mb-3 lg:text-xl lg:mb-4">
                  Your Invoices
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3">
                  {completedInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="relative border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between p-3">
                          <button
                            onClick={() => handleOpenCompleted(invoice.id)}
                            className="flex-1 min-w-0 pr-2 text-left"
                          >
                            <div className="font-medium text-gray-900 truncate">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {invoice.customer.name || "No customer"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {invoice.items?.length || 0} item
                              {invoice.items?.length !== 1 ? "s" : ""} •{" "}
                              {formatDate(new Date(invoice.updatedAt))}
                            </div>
                          </button>
                          <div className="ml-3 flex-shrink-0 flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={18} className="text-primary" />
                              <button
                                onClick={(e) =>
                                  handleDeleteCompleted(e, invoice.id)
                                }
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors"
                                aria-label="Delete invoice"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.total || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
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
