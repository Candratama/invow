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
  SettingsPageStore,
  SettingsPageSubscription,
  SettingsPagePreferences,
  SettingsPageData,
} from "@/lib/db/data-access/settings";
import { useSettingsData } from "@/lib/hooks/use-settings-data";

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
  { id: "business", label: "Business Info" },
  { id: "invoice", label: "Invoice Settings" },
  { id: "subscription", label: "Subscription" },
];

interface SettingsClientProps {
  initialData: SettingsPageData | null;
}

export function SettingsClient({ initialData }: SettingsClientProps) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { data, isLoading } = useSettingsData(initialData ?? undefined);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Determine default tab from URL parameters
  const tabParam = searchParams.get("tab");
  const autoUpgrade = searchParams.get("autoUpgrade");

  const getDefaultTab = (): TabId => {
    if (autoUpgrade) return "subscription";
    if (tabParam === "subscription" || tabParam === "invoice") return tabParam;
    return "business";
  };

  const [activeTab, setActiveTab] = useState<TabId>(getDefaultTab);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    () => new Set([getDefaultTab()])
  );

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle browser back button with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState({ settingsPage: true }, "");
    const handlePopState = () => {
      if (isDirty) {
        setShowWarning(true);
        window.history.pushState({ settingsPage: true }, "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  // Prefetch other tabs after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountedTabs(new Set(["subscription", "business", "invoice"]));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handlePaymentSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowWarning(true);
    } else {
      router.push("/dashboard");
    }
  }, [isDirty, router]);

  const handleTabSwitch = useCallback(
    (newTab: TabId) => {
      if (newTab === activeTab) return;
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

  const handleDiscard = useCallback(() => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setIsDirty(false);
      setPendingTab(null);
      setShowWarning(false);
    } else {
      setIsDirty(false);
      setShowWarning(false);
      router.push("/dashboard");
    }
  }, [pendingTab, router]);

  const handleCancelWarning = useCallback(() => {
    setPendingTab(null);
    setShowWarning(false);
  }, []);

  const handleSaveAndSwitch = useCallback(() => {
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
        setTimeout(() => {
          if (pendingTab) {
            setActiveTab(pendingTab);
            setIsDirty(false);
            setPendingTab(null);
            setShowWarning(false);
          } else {
            setIsDirty(false);
            setShowWarning(false);
            router.push("/dashboard");
          }
        }, 500);
      }
    }
  }, [activeTab, pendingTab, router]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowWarning(true);
    } else {
      router.push("/dashboard");
    }
  }, [isDirty, router]);

  // NOW we can do conditional returns - after all hooks
  if (authLoading || (isLoading && !data)) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return null;
  }

  // Extract data from query result
  const initialStore = (data?.store as SettingsPageStore) || null;
  const initialContacts = (data?.contacts as StoreContact[]) || [];
  const initialSubscription =
    (data?.subscription as SettingsPageSubscription) || null;
  const initialPreferences =
    (data?.preferences as SettingsPagePreferences) || null;
  const initialIsPremium = data?.isPremium || false;

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
        <PaymentSuccessHandler onPaymentSuccess={handlePaymentSuccess} />

        {/* Header */}
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
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b z-20 shadow-sm flex-shrink-0">
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 lg:pt-2">
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

        {/* Tab Content */}
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
                  initialIsPremium={initialIsPremium}
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
                  userEmail={user?.email || ""}
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
          <div className="py-3 sm:py-4">
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
