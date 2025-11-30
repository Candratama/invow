"use client";

import { Suspense, useState, useCallback, useEffect, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StoreContact } from "@/lib/db/database.types";
import type {
  AccountPageStore,
  AccountPageSubscription,
  AccountPagePreferences,
} from "@/lib/db/data-access/account";

// Lazy load tabs for better performance
const SubscriptionTab = lazy(() =>
  import("@/components/features/settings/subscription-tab").then((mod) => ({
    default: mod.SubscriptionTab,
  }))
);
const BusinessInfoTab = lazy(() =>
  import("@/components/features/settings/business-info-tab").then((mod) => ({
    default: mod.BusinessInfoTab,
  }))
);
const InvoiceSettingsTab = lazy(() =>
  import("@/components/features/settings/invoice-settings-tab").then((mod) => ({
    default: mod.InvoiceSettingsTab,
  }))
);

type TabId = "subscription" | "business" | "invoice";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "subscription", label: "Subscription" },
  { id: "business", label: "Business Info" },
  { id: "invoice", label: "Invoice Settings" },
];

interface AccountClientProps {
  initialStore: AccountPageStore | null;
  initialContacts: StoreContact[];
  initialSubscription: AccountPageSubscription | null;
  initialPreferences: AccountPagePreferences | null;
}

export function AccountClient({
  initialStore,
  initialContacts,
  initialSubscription,
  initialPreferences,
}: AccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Determine default tab from URL parameters
  const tabParam = searchParams.get("tab");
  const autoUpgrade = searchParams.get("autoUpgrade");

  const getDefaultTab = (): TabId => {
    // If autoUpgrade is present, open subscription tab
    if (autoUpgrade) return "subscription";
    // If tab parameter is valid, use it
    if (tabParam === "business" || tabParam === "invoice") return tabParam;
    // Default to subscription
    return "subscription";
  };

  const defaultTab = getDefaultTab();
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    new Set([defaultTab])
  );

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Prefetch next tab data on hover
  useEffect(() => {
    const timer = setTimeout(() => {
      // Prefetch other tabs after initial load
      setMountedTabs(new Set(["subscription", "business", "invoice"]));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handlePaymentSuccess = () => {
    // Refresh the page to get updated subscription data from server
    router.refresh();
  };

  const handleBack = () => {
    if (isDirty) {
      // Show warning if there are unsaved changes
      setShowWarning(true);
    } else {
      router.push("/dashboard");
    }
  };

  // Handle tab switch with unsaved changes check
  const handleTabSwitch = useCallback(
    (newTab: TabId) => {
      if (newTab === activeTab) return;

      // Mount the tab if not already mounted
      setMountedTabs((prev) => new Set([...prev, newTab]));

      if (isDirty) {
        setPendingTab(newTab);
        setShowWarning(true);
      } else {
        setActiveTab(newTab);
      }
    },
    [activeTab, isDirty]
  );

  // Handle discard changes
  const handleDiscard = useCallback(() => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setIsDirty(false);
      setPendingTab(null);
      setShowWarning(false);
    } else {
      // If no pending tab, user wants to navigate back
      setIsDirty(false);
      setShowWarning(false);
      router.push("/dashboard");
    }
  }, [pendingTab, router]);

  // Handle cancel warning
  const handleCancelWarning = useCallback(() => {
    setPendingTab(null);
    setShowWarning(false);
  }, []);

  // Handle save and switch
  const handleSaveAndSwitch = useCallback(() => {
    // Trigger form submission in the active tab
    const formId =
      activeTab === "business"
        ? "business-info-form"
        : activeTab === "invoice"
        ? "invoice-settings-form"
        : null;

    if (formId) {
      const form = document.getElementById(formId) as HTMLFormElement;
      if (form) {
        form.requestSubmit();
        // After successful save, switch tabs or navigate back
        setTimeout(() => {
          if (pendingTab) {
            setActiveTab(pendingTab);
            setIsDirty(false);
            setPendingTab(null);
            setShowWarning(false);
          } else {
            // User wants to navigate back
            setIsDirty(false);
            setShowWarning(false);
            router.push("/dashboard");
          }
        }, 500);
      }
    }
  }, [activeTab, pendingTab, router]);

  const handleClose = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
        {/* Payment Success/Failure Handler */}
        <PaymentSuccessHandler onPaymentSuccess={handlePaymentSuccess} />

        {/* Header - Fixed */}
        <div className="bg-white border-b z-30 shadow-sm flex-shrink-0">
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Account Settings
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Fixed */}
        <div className="bg-white border-b z-20 shadow-sm flex-shrink-0">
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8">
            <div className="flex justify-start gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`px-4 lg:px-6 py-4 text-sm font-medium transition-colors border-b-2 min-h-[48px] whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-hidden bg-white">
          <Suspense fallback={<SettingsSkeleton />}>
            {mountedTabs.has("subscription") && (
              <div
                className="h-full"
                style={{
                  display: activeTab === "subscription" ? "block" : "none",
                }}
              >
                <SubscriptionTab
                  onClose={handleClose}
                  initialSubscription={initialSubscription}
                />
              </div>
            )}
            {mountedTabs.has("business") && (
              <div
                className="h-full"
                style={{ display: activeTab === "business" ? "block" : "none" }}
              >
                <BusinessInfoTab
                  onClose={handleClose}
                  onDirtyChange={setIsDirty}
                  initialStore={initialStore}
                  initialContacts={initialContacts}
                />
              </div>
            )}
            {mountedTabs.has("invoice") && (
              <div
                className="h-full"
                style={{ display: activeTab === "invoice" ? "block" : "none" }}
              >
                <InvoiceSettingsTab
                  onClose={handleClose}
                  onDirtyChange={setIsDirty}
                  initialStore={initialStore}
                  initialPreferences={initialPreferences}
                  userTier={initialSubscription?.tier || "free"}
                />
              </div>
            )}
          </Suspense>
        </div>
      </div>

      {/* Unsaved Changes Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Unsaved Changes
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4 roun">
            <p className="text-sm text-gray-600">
              You have unsaved changes. What would you like to do?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveAndSwitch}
              className="w-full min-h-[44px]"
            >
              Save and Continue
            </Button>
            <Button
              onClick={handleDiscard}
              variant="destructive"
              className="w-full min-h-[44px]"
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleCancelWarning}
              variant="outline"
              className="w-full min-h-[44px]"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
