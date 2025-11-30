"use client";

import { useState, useEffect } from "react";
import { Gift, Zap, AlertCircle } from "lucide-react";
import { getSubscriptionStatusAction } from "@/app/actions/subscription";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import UpgradeButton from "@/components/features/subscription/upgrade-button";
import { TIER_CONFIGS } from "@/lib/config/pricing";

interface SubscriptionStatus {
  tier: string;
  invoiceLimit: number;
  remainingInvoices: number;
  currentMonthCount: number;
  monthYear: string;
  resetDate: Date;
}

interface SubscriptionTabProps {
  onClose: () => void;
  initialSubscription?: SubscriptionStatus | null;
}

export function SubscriptionTab({
  onClose,
  initialSubscription,
}: SubscriptionTabProps) {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    initialSubscription || null
  );
  const [isLoading, setIsLoading] = useState(!initialSubscription);
  const [error, setError] = useState<Error | null>(null);

  // Fetch subscription status using Server Action only if not provided via props
  useEffect(() => {
    // Skip fetching if initialSubscription was provided
    if (initialSubscription) {
      return;
    }

    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getSubscriptionStatusAction();

      if (result.error || !result.data) {
        setError(
          typeof result.error === "string"
            ? new Error(result.error)
            : result.error || new Error("Failed to load subscription")
        );
      } else {
        setSubscription(result.data);
      }

      setIsLoading(false);
    };

    fetchSubscription();
  }, [user?.id, initialSubscription]);

  // Get tier display info
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "free":
        return {
          name: "Free",
          icon: <Gift className="w-6 h-6" />,
          color: "text-primary",
          bgColor: "bg-accent",
        };
      case "premium":
        return {
          name: "Premium",
          icon: <Zap className="w-6 h-6" />,
          color: "text-primary",
          bgColor: "bg-accent",
        };
      default:
        return {
          name: "Unknown",
          icon: <Gift className="w-6 h-6" />,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
    }
  };

  // Format reset date
  const formatResetDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading subscription details...</div>
      </div>
    );
  }

  // Error state
  if (error || !subscription) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "Failed to load subscription"}
        </p>
      </div>
    );
  }

  const tierInfo = getTierInfo(subscription.tier);
  const usagePercentage =
    (subscription.currentMonthCount / subscription.invoiceLimit) * 100;
  const tierConfig = TIER_CONFIGS[subscription.tier];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 space-y-4 sm:space-y-6 lg:py-8">
        <div className="lg:max-w-3xl lg:mx-auto space-y-4 sm:space-y-6">
          {/* Subscription Status Section */}
          <div>
            <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              {/* Tier Header */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`${tierInfo.bgColor} ${tierInfo.color} p-2 sm:p-3 rounded-lg`}
                >
                  {tierInfo.icon}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold">
                    {tierInfo.name} Plan
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tierConfig?.priceFormatted || "Free"}{" "}
                    {subscription.tier !== "free" && "/ 30 days"}
                  </p>
                </div>
              </div>

              {/* Invoice Usage */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm lg:text-base">
                  <span className="text-muted-foreground">
                    Invoices this period
                  </span>
                  <span className="font-medium">
                    {subscription.currentMonthCount} /{" "}
                    {subscription.invoiceLimit === 999999
                      ? "∞"
                      : subscription.invoiceLimit}
                  </span>
                </div>

                {/* Progress bar */}
                {subscription.invoiceLimit !== 999999 && (
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        usagePercentage >= 90
                          ? "bg-red-500"
                          : usagePercentage >= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                )}

                {/* Remaining invoices */}
                <div className="flex items-center justify-between text-sm lg:text-base">
                  <span className="text-muted-foreground">Remaining</span>
                  <span
                    className={`font-semibold ${
                      subscription.invoiceLimit === 999999
                        ? "text-purple-600"
                        : subscription.remainingInvoices <= 5
                        ? "text-red-600"
                        : subscription.remainingInvoices <= 20
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {subscription.invoiceLimit === 999999
                      ? "Unlimited"
                      : `${subscription.remainingInvoices} invoices`}
                  </span>
                </div>
              </div>

              {/* Reset/Expiry date */}
              {subscription.resetDate && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {subscription.tier === "free" ? "Resets on" : "Expires on"}{" "}
                    {formatResetDate(new Date(subscription.resetDate))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Options Section - Only show for free tier */}
          {subscription.tier === "free" && (
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Upgrade Your Plan
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {/* Premium Plan */}
                <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <h3 className="text-base sm:text-lg font-semibold">
                          Premium Plan
                        </h3>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                        {TIER_CONFIGS.premium.priceFormatted}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        per 30 days
                      </p>
                    </div>
                    <UpgradeButton
                      tier="premium"
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[44px]"
                    >
                      Upgrade to Premium
                    </UpgradeButton>
                  </div>
                  <ul className="space-y-2">
                    {TIER_CONFIGS.premium.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs sm:text-sm"
                      >
                        <span className="text-blue-600 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Section */}
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-red-600">
              Danger Zone
            </h2>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold mb-1">
                    Sign Out
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sign out of your account. You&apos;ll need to sign in again
                    to access your data.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="flex-shrink-0 w-full sm:w-auto min-h-[44px]"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons - Sticky at bottom */}
      <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4 lg:p-6 shadow-lg z-10">
        <div className="flex gap-2 sm:gap-3 lg:max-w-3xl lg:mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px]"
            size="lg"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
