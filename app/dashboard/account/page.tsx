"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import SubscriptionStatus from "@/components/features/subscription/status";
import UpgradeButton from "@/components/features/subscription/upgrade-button";
import PaymentSuccessHandler from "@/components/features/payment/success-handler";
import { StoreSettingsTab } from "@/components/features/settings/store-settings-tab";
import { ContactPersonTab } from "@/components/features/settings/contact-person-tab";
import { UserPreferencesTab } from "@/components/features/settings/user-preferences-tab";
import { useSubscriptionStatus } from "@/lib/hooks/use-dashboard-data";
import { useQueryClient } from "@tanstack/react-query";

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [activeTab, setActiveTab] = useState<"subscription" | "store" | "contacts" | "preferences">("subscription");

  // Use React Query for subscription data - automatic caching and background refetching
  const { data: subscription, isLoading: subscriptionLoading } = useSubscriptionStatus();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading account..." />;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    if (
      confirm(
        "Are you sure you want to sign out?",
      )
    ) {
      await signOut();
      router.push("/");
    }
  };

  const handlePaymentSuccess = () => {
    // Trigger subscription refresh after successful payment
    setRefreshTrigger((prev) => !prev);
    // Invalidate React Query cache to refetch subscription data
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payment Success/Failure Handler */}
      <PaymentSuccessHandler onPaymentSuccess={handlePaymentSuccess} />
      
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Account Settings
            </h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-around">
            {[
              { id: "subscription" as const, label: "Subscription" },
              { id: "store" as const, label: "Store" },
              { id: "contacts" as const, label: "Contacts" },
              { id: "preferences" as const, label: "Preferences" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-3 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
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
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 lg:px-6 lg:py-8">

        {/* Tab Content */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="font-semibold text-lg mb-4">Subscription</h2>
                <SubscriptionStatus 
                  className="border-0 shadow-none p-0" 
                  triggerRefresh={refreshTrigger}
                />
            
            {/* Show upgrade button for free tier users or users near their limit */}
            {!subscriptionLoading && subscription && (
              <>
                {subscription.tier === "free" && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Upgrade to Starter plan for 200 invoices per month
                      </p>
                      <UpgradeButton 
                        tier="starter" 
                        className="w-full"
                        requireAuth={false}
                      >
                        Upgrade to Starter - Rp 15,000
                      </UpgradeButton>
                    </div>
                  </div>
                )}
                
                {subscription.tier === "free" && subscription.remainingInvoices <= 10 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ You&apos;re running low on invoices!
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Only {subscription.remainingInvoices} invoices remaining this month. Upgrade now to avoid interruption.
                    </p>
                  </div>
                )}

                {subscription.tier === "starter" && subscription.remainingInvoices <= 20 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ You&apos;re running low on invoices!
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Only {subscription.remainingInvoices} invoices remaining this month.
                    </p>
                  </div>
                )}
              </>
            )}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    value={user.email || ""}
                    disabled
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={user.id}
                    disabled
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4 text-red-600">Sign Out</h2>
              <p className="text-sm text-gray-600 mb-4">
                You&apos;ll need to log in again to access your account after signing out.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full py-3 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {activeTab === "store" && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <StoreSettingsTab onClose={() => router.push("/dashboard")} />
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ContactPersonTab onClose={() => router.push("/dashboard")} />
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <UserPreferencesTab onClose={() => router.push("/dashboard")} />
          </div>
        )}
      </main>
    </div>
  );
}
