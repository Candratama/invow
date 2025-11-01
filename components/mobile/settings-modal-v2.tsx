"use client";

import { useState } from "react";
import { BottomSheet } from "./bottom-sheet";
import { StoreSettingsTab } from "./settings-tabs/store-settings-tab";
import { ContactPersonTab } from "./settings-tabs/contact-person-tab";
import { UserPreferencesTab } from "./settings-tabs/user-preferences-tab";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "store" | "contact" | "preferences";

export function SettingsModalV2({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("store");

  const tabs = [
    { id: "store" as Tab, label: "Store" },
    { id: "contact" as Tab, label: "Contact" },
    { id: "preferences" as Tab, label: "Preferences" },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      fullScreen
      maxWidth="2xl"
    >
      <div className="flex flex-col h-full lg:max-h-[calc(95vh-64px)]">
        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex lg:max-w-3xl lg:mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "store" && <StoreSettingsTab onClose={onClose} />}
          {activeTab === "contact" && <ContactPersonTab onClose={onClose} />}
          {activeTab === "preferences" && (
            <UserPreferencesTab onClose={onClose} />
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
