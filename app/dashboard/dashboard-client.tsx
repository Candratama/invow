"use client";

import { useState, useTransition } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { InvoiceForm } from "@/components/features/invoice/invoice-form";
import { InvoicePreview } from "@/components/features/invoice/invoice-preview";
import { FABButton } from "@/components/ui/fab-button";
import { RevenueCards } from "@/components/features/dashboard/revenue-cards";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { Pagination } from "@/components/ui/pagination";
import { InvoiceCard } from "@/components/features/dashboard/invoice-card";
import { WelcomeBanner } from "@/components/features/onboarding/welcome-banner";
import { useInvoiceStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/auth-context";
import { Invoice } from "@/lib/types";
import { parseLocalDate } from "@/lib/utils";
import { generateJPEGFromInvoice } from "@/lib/utils/invoice-generator";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import {
  useDashboardData,
  useInvalidateDashboard,
  type DashboardData,
} from "@/lib/hooks/use-dashboard-data";
import type { InvoiceWithItems } from "@/lib/db/services/invoices.service";
import type { InvoiceItem } from "@/lib/db/database.types";
import type { StoreSettings } from "@/lib/types";

interface DashboardClientProps {
  initialData: DashboardData | null;
}

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

  // Use React Query with initial data from server
  const { data, isLoading } = useDashboardData(initialData || undefined);

  // Extract data from query result
  const invoices = (data?.invoices || []) as InvoiceWithItems[];
  const revenueMetrics = data?.revenueMetrics || {
    totalRevenue: 0,
    monthlyRevenue: 0,
    invoiceCount: 0,
    monthlyInvoiceCount: 0,
    averageOrderValue: 0,
    monthlyAverageOrderValue: 0,
  };
  const subscriptionStatus = data?.subscriptionStatus || null;
  const storeSettings = data?.storeSettings as StoreSettings | null;
  const defaultStore = data?.defaultStore || null;
  const totalPages = data?.totalPages || 1;
  const hasMoreHistory = data?.hasMoreHistory || false;
  const historyLimitMessage = data?.historyLimitMessage;

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

  const handleNewInvoice = () => {
    initializeNewInvoice();
    setView("form");
  };

  const handleOpenCompleted = async (invoiceId: string) => {
    await loadCompleted(invoiceId);
    setView("form");
  };

  const handleDeleteCompleted = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    if (confirm("Delete this invoice?")) {
      startTransition(async () => {
        const result = await deleteInvoiceAction(invoiceId);
        if (result.success) {
          // Invalidate cache to refetch data
          invalidateDashboard();
          toast.success("Invoice deleted successfully");
        } else {
          toast.error(result.error || "Failed to delete invoice");
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
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
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
      <div className="fixed inset-0 z-50 bg-gray-50">
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
            hasBusinessInfo={!!defaultStore}
          />

          <RevenueCards
            metrics={revenueMetrics}
            subscriptionStatus={subscriptionStatus}
            isLoading={isLoading}
          />

          <>
            {isPending || isLoading ? (
              <InvoicesListSkeleton />
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
                <p className="text-gray-500">No invoices yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first invoice to get started
                </p>
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
