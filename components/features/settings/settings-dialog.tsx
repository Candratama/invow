"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubscriptionTab } from "./subscription-tab";
import { BusinessInfoTab } from "./business-info-tab";
import { InvoiceSettingsTab } from "./invoice-settings-tab";
import { ReportsTab } from "./reports-tab";

type TabId = "subscription" | "business" | "invoice" | "reports";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "subscription", label: "Subscription" },
  { id: "business", label: "Business Info" },
  { id: "invoice", label: "Invoice Settings" },
  { id: "reports", label: "Reports" },
];

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: TabId;
}

export function SettingsDialog({
  isOpen,
  onClose,
  defaultTab = "subscription",
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // Handle tab switch with unsaved changes check
  const handleTabSwitch = useCallback(
    (newTab: TabId) => {
      if (newTab === activeTab) return;

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
    }
  }, [pendingTab]);

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
        // After successful save, switch tabs
        setTimeout(() => {
          if (pendingTab) {
            setActiveTab(pendingTab);
            setIsDirty(false);
            setPendingTab(null);
            setShowWarning(false);
          }
        }, 500);
      }
    }
  }, [activeTab, pendingTab]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[90vh] sm:h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl">Settings</DialogTitle>
          </DialogHeader>

          {/* Tab Navigation - Sticky at top */}
          <div className="border-b flex-shrink-0 sticky top-0 bg-white z-20 shadow-sm">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex-1 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 min-h-[44px] ${
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

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "subscription" && (
              <SubscriptionTab onClose={onClose} />
            )}
            {activeTab === "business" && (
              <BusinessInfoTab onClose={onClose} onDirtyChange={setIsDirty} />
            )}
            {activeTab === "invoice" && (
              <InvoiceSettingsTab
                onClose={onClose}
                onDirtyChange={setIsDirty}
              />
            )}
            {activeTab === "reports" && <ReportsTab onClose={onClose} />}
          </div>
        </DialogContent>
      </Dialog>

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
              Save and Switch
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
