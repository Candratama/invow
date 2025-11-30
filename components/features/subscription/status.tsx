"use client";

import { useTransition } from "react";
import { RefreshCw, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SubscriptionData {
  tier: string;
  invoiceLimit: number;
  currentMonthCount: number;
  remainingInvoices: number;
  resetDate: string | null;
}

interface SubscriptionStatusProps {
  className?: string;
  subscription: SubscriptionData | null;
}

export default function SubscriptionStatus({
  className = "",
  subscription,
}: SubscriptionStatusProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Manual refresh handler
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Get tier display info
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "free":
        return {
          name: "Free",
          icon: <Gift className="w-5 h-5" />,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
      case "starter":
        return {
          name: "Starter",
          icon: <Zap className="w-5 h-5" />,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      default:
        return {
          name: "Unknown",
          icon: <Gift className="w-5 h-5" />,
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

  // No subscription data
  if (!subscription) {
    return null;
  }

  const tierInfo = getTierInfo(subscription.tier);
  const usagePercentage =
    (subscription.currentMonthCount / subscription.invoiceLimit) * 100;

  return (
    <div className={`rounded-lg border bg-card p-6 shadow-sm ${className}`}>
      <div className="space-y-4">
        {/* Header with tier and refresh button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`${tierInfo.bgColor} ${tierInfo.color} p-2 rounded-lg`}
            >
              {tierInfo.icon}
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold">
                {tierInfo.name} Plan
              </h3>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Current subscription
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-8 w-8"
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Invoice usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm lg:text-base">
            <span className="text-muted-foreground">Invoices this month</span>
            <span className="font-medium">
              {subscription.currentMonthCount} / {subscription.invoiceLimit}
            </span>
          </div>

          {/* Progress bar */}
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

          {/* Remaining invoices */}
          <div className="flex items-center justify-between text-sm lg:text-base">
            <span className="text-muted-foreground">Remaining</span>
            <span
              className={`font-semibold ${
                subscription.remainingInvoices <= 5
                  ? "text-red-600"
                  : subscription.remainingInvoices <= 20
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {subscription.remainingInvoices} invoices
            </span>
          </div>
        </div>

        {/* Reset/Expiry date */}
        {subscription.resetDate && (
          <div className="pt-3 border-t">
            <p className="text-xs lg:text-sm text-muted-foreground">
              {subscription.tier === "free" ? "Resets on" : "Expires on"}{" "}
              {formatResetDate(new Date(subscription.resetDate))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
