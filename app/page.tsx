"use client";

import { useState, useEffect } from "react";
import { Settings, Trash2, Plus, CheckCircle } from "lucide-react";
import { InvoiceFormMobile } from "@/components/mobile/invoice-form-mobile";
import { InvoicePreview } from "@/components/mobile/invoice-preview";
import { FABButton } from "@/components/mobile/fab-button";
import { SettingsModal } from "@/components/mobile/settings-modal";
import { UserMenu } from "@/components/mobile/user-menu";
import { RevenueCards } from "@/components/revenue-cards";
import { InvoicesListSkeleton } from "@/components/skeletons/invoices-list-skeleton";
import { useInvoiceStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/auth-context";
import { Invoice } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { generateJPEGFromInvoice } from "@/lib/invoice-generator";
import { calculateRevenueMetrics } from "@/lib/revenue-utils";

function PreviewView({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const { currentInvoice, storeSettings, saveCompleted } = useInvoiceStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadJPEG = async () => {
    if (!currentInvoice || !currentInvoice.id) return;

    setIsGenerating(true);

    try {
      await generateJPEGFromInvoice(currentInvoice as Invoice, storeSettings);

      // Save as completed invoice
      if (currentInvoice.id) {
        saveCompleted();
      }

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
        storeSettings={storeSettings}
        onDownloadJPEG={handleDownloadJPEG}
        isGenerating={isGenerating}
      />
    </>
  );
}

export default function HomePage() {
  const [view, setView] = useState<"home" | "form" | "preview">("home");
  const [showSettings, setShowSettings] = useState(false);
  const {
    completedInvoices,
    initializeNewInvoice,
    storeSettings,
    loadCompleted,
    deleteCompleted,
    isLoading,
    isInitialLoad,
  } = useInvoiceStore();

  // Get auth state
  const { user } = useAuth();

  // Monitor online/offline status

  // Show settings modal on first visit if not configured
  useEffect(() => {
    if (!storeSettings && view === "home") {
      const timer = setTimeout(() => {
        setShowSettings(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [storeSettings, view]);

  const handleNewInvoice = () => {
    initializeNewInvoice();
    setView("form");
  };

  const handleOpenCompleted = (invoiceId: string) => {
    loadCompleted(invoiceId);
    setView("form");
  };

  const handleDeleteCompleted = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    if (confirm("Delete this invoice?")) {
      deleteCompleted(invoiceId);
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
        <InvoiceFormMobile onComplete={handleInvoiceComplete} />
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <circle cx="11" cy="4" r="2" />
              <circle cx="18" cy="8" r="2" />
              <circle cx="20" cy="16" r="2" />
              <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
            </svg>
            Invow
          </h1>
          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu onOpenSettings={() => setShowSettings(true)} />
            ) : (
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
            )}
          </div>
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
            metrics={calculateRevenueMetrics(completedInvoices)}
            isLoading={isLoading && isInitialLoad}
          />

          {/* Invoices List */}
          <>
            {isLoading && isInitialLoad ? (
              <InvoicesListSkeleton />
            ) : completedInvoices.length > 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-sm lg:p-8">
                <h3 className="font-semibold text-gray-900 mb-3 lg:text-xl lg:mb-4">
                  Your Invoices
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3">
                  {completedInvoices
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((invoice) => (
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
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center lg:p-12">
                <p className="text-gray-500">No invoices yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first invoice to get started
                </p>
                {!user && (
                  <p className="text-xs text-blue-600 mt-3">
                    💡 Sign in to sync across devices
                  </p>
                )}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
