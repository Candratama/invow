"use client";

import { useState } from "react";
import {
  Gift,
  Zap,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  CreditCard,
  Loader2,
  Clock,
} from "lucide-react";
import { getSubscriptionStatusAction } from "@/app/actions/subscription";
import { getSubscriptionPlansAction } from "@/app/actions/admin-pricing";
import { updatePasswordAction } from "@/app/actions/auth";
import { createPaymentInvoiceAction } from "@/app/actions/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UpgradeButton from "@/components/features/subscription/upgrade-button";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubscriptionStatus {
  tier: string;
  invoiceLimit: number;
  remainingInvoices: number;
  currentMonthCount: number;
  monthYear: string;
  resetDate: Date;
}

interface AccountTabProps {
  onClose: () => void;
  initialSubscription?: SubscriptionStatus | null;
}

export function AccountTab({ onClose, initialSubscription }: AccountTabProps) {
  const { user, signOut } = useAuth();

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isBuyingCredit, setIsBuyingCredit] = useState(false);

  // Fetch subscription status with React Query
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const result = await getSubscriptionStatusAction();
      if (result.error || !result.data) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Failed to load subscription"
        );
      }
      return result.data;
    },
    initialData: initialSubscription || undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch pricing plans from database
  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const result = await getSubscriptionPlansAction(false);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

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
    return date.toLocaleDateString("id-ID", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await updatePasswordAction(newPassword);
      if (result.success) {
        toast.success("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Failed to update password");
      }
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      await signOut();
    }
  };

  // Handle buy credit - redirect to Mayar payment gateway
  const handleBuyCredit = async () => {
    setIsBuyingCredit(true);
    try {
      const result = await createPaymentInvoiceAction("premium");

      if (!result.success) {
        throw new Error(result.error || "Failed to create payment invoice");
      }

      // Redirect to Mayar payment URL
      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(errorMessage);
      setIsBuyingCredit(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Memuat detail subscription...</div>
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
            : "Gagal memuat subscription"}
        </p>
      </div>
    );
  }

  const tierInfo = getTierInfo(subscription.tier);
  const usagePercentage =
    (subscription.currentMonthCount / subscription.invoiceLimit) * 100;

  // Find current tier config from plans data
  const tierConfig = plans?.find((p) => p.tier === subscription.tier);

  // Calculate days until expiry for premium users
  const daysUntilExpiry = subscription.resetDate
    ? Math.ceil(
        (new Date(subscription.resetDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Determine if user is in renewal grace period (H-7 or less)
  const isInGracePeriod =
    subscription.tier === "premium" &&
    daysUntilExpiry !== null &&
    daysUntilExpiry <= 7;

  // Get urgency level for styling
  const getUrgencyLevel = () => {
    if (daysUntilExpiry === null) return null;
    if (daysUntilExpiry <= 1) return "urgent";
    if (daysUntilExpiry <= 3) return "warning";
    if (daysUntilExpiry <= 7) return "info";
    return null;
  };

  const urgencyLevel = getUrgencyLevel();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 space-y-4 sm:space-y-6 lg:py-8">
        <div className="lg:max-w-3xl lg:mx-auto space-y-4 sm:space-y-6">
          {/* Subscription Status Section */}
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
              Subscription
            </h2>
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
                    {tierConfig?.priceFormatted || "Gratis"}{" "}
                    {subscription.tier !== "free" && "/ 30 hari"}
                  </p>
                </div>
              </div>

              {/* Invoice Usage */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm lg:text-base">
                  <span className="text-muted-foreground">
                    Invoice periode ini
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
                  <span className="text-muted-foreground">Tersisa</span>
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
                      ? "Tidak terbatas"
                      : `${subscription.remainingInvoices} invoice`}
                  </span>
                </div>
              </div>

              {/* Reset/Expiry date */}
              {subscription.resetDate && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {subscription.tier === "free" ? "Reset pada" : "Berakhir pada"}{" "}
                    {formatResetDate(new Date(subscription.resetDate))}
                  </p>
                </div>
              )}

              {/* Renewal/Buy Credit Section - Show for premium users */}
              {subscription.tier === "premium" && (
                <div
                  className={`pt-3 border-t ${
                    isInGracePeriod
                      ? urgencyLevel === "urgent"
                        ? "bg-red-50 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 rounded-b-lg"
                        : urgencyLevel === "warning"
                        ? "bg-amber-50 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 rounded-b-lg"
                        : "bg-blue-50 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 rounded-b-lg"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      {isInGracePeriod ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock
                              className={`h-4 w-4 ${
                                urgencyLevel === "urgent"
                                  ? "text-red-600"
                                  : urgencyLevel === "warning"
                                  ? "text-amber-600"
                                  : "text-blue-600"
                              }`}
                            />
                            <p
                              className={`text-sm font-semibold ${
                                urgencyLevel === "urgent"
                                  ? "text-red-700"
                                  : urgencyLevel === "warning"
                                  ? "text-amber-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {daysUntilExpiry === 1
                                ? "Subscription berakhir besok!"
                                : `Subscription berakhir dalam ${daysUntilExpiry} hari`}
                            </p>
                          </div>
                          <p
                            className={`text-xs ${
                              urgencyLevel === "urgent"
                                ? "text-red-600"
                                : urgencyLevel === "warning"
                                ? "text-amber-600"
                                : "text-blue-600"
                            }`}
                          >
                            Perpanjang sekarang untuk terus menggunakan fitur
                            premium
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            Butuh lebih banyak invoice?
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Perpanjang subscription untuk mendapatkan kredit tambahan
                          </p>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={handleBuyCredit}
                      disabled={isBuyingCredit}
                      variant={isInGracePeriod ? "default" : "outline"}
                      size="sm"
                      className={`w-auto sm:h-auto min-w-[10px] px-8 ${
                        isInGracePeriod
                          ? urgencyLevel === "urgent"
                            ? "bg-red-600 hover:bg-red-700"
                            : urgencyLevel === "warning"
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }`}
                    >
                      {isBuyingCredit ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : isInGracePeriod ? (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          <span>Perpanjang Sekarang</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Buy Credit</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Options Section - Only show for free tier */}
          {subscription.tier === "free" && plans && plans.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Upgrade Your Plan
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {plans
                  .filter((plan) => plan.tier !== "free" && plan.isActive)
                  .map((plan) => (
                    <div
                      key={plan.tier}
                      className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            <h3 className="text-base sm:text-lg font-semibold">
                              {plan.name}
                            </h3>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-primary mb-1">
                            {plan.priceFormatted}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            per 30 hari
                          </p>
                        </div>
                        <UpgradeButton
                          tier={plan.tier as "premium" | "pro"}
                          variant="default"
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          Upgrade to {plan.name}
                        </UpgradeButton>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-xs sm:text-sm"
                          >
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Account Section */}
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
              Account
            </h2>
            <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              {/* Email Address */}
              <div>
                <Label htmlFor="userEmail" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 bg-gray-50 cursor-not-allowed min-h-[44px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email akun tidak dapat diubah di sini
                </p>
              </div>

              {/* Change Password */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Change Password</Label>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="min-h-[44px] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="min-h-[44px] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword || !newPassword || !confirmPassword
                    }
                    className="w-full min-h-[44px]"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Password minimal 8 karakter
                </p>
              </div>
            </div>
          </div>

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
                    Keluar dari akun Anda. Anda perlu masuk kembali untuk
                    mengakses data Anda.
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
