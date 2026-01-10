"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PaymentNotification from "@/components/features/payment/notification";
import PaymentWarningModal from "@/components/features/payment/payment-warning-modal";
import { usePaymentNotification } from "@/lib/hooks/use-payment-notification";
import { useAuth } from "@/lib/auth/auth-context";
import { createPaymentInvoiceAction } from "@/app/actions/payments";

interface UpgradeButtonProps {
  tier: "premium" | "pro" | string;
  variant?: "default" | "outline";
  className?: string;
  children?: React.ReactNode;
  requireAuth?: boolean; // If true, check auth before proceeding
}

export default function UpgradeButton({
  tier,
  variant = "default",
  className = "",
  children = "Upgrade Now",
  requireAuth = true,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notificationState, showFailure, closeNotification } =
    usePaymentNotification();

  // Auto-trigger upgrade if specified in URL
  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading) {
      const params = new URLSearchParams(window.location.search);
      const autoUpgrade = params.get("autoUpgrade");
      if (autoUpgrade === tier && !isLoading && !showWarningModal) {
        // Remove the parameter and show warning modal
        params.delete("autoUpgrade");
        const newUrl = `${window.location.pathname}${
          params.toString() ? "?" + params.toString() : ""
        }`;
        window.history.replaceState({}, "", newUrl);
        handleUpgradeClick();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, authLoading]);

  /**
   * Handle initial upgrade button click
   * Shows warning modal for authenticated users, redirects to signup for unauthenticated
   */
  const handleUpgradeClick = () => {
    // Check if user is authenticated
    if (requireAuth && !user) {
      // User not logged in, redirect to signup with return URL that includes autoUpgrade
      const returnUrl = `/dashboard/settings?autoUpgrade=${tier}`;
      router.push(
        `/dashboard/signup?returnUrl=${encodeURIComponent(returnUrl)}`
      );
      return;
    }

    // Show warning modal before proceeding
    setShowWarningModal(true);
  };

  /**
   * Handle confirmation from warning modal
   * Proceeds with actual payment creation and redirect to Mayar
   */
  const handleConfirmPayment = async () => {
    setIsLoading(true);

    try {
      // Call the Server Action instead of API route
      const result = await createPaymentInvoiceAction(tier as "premium");

      if (!result.success) {
        throw new Error(result.error || "Failed to create payment invoice");
      }

      // Redirect to Mayar payment URL on success
      if (result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showFailure(errorMessage);
      setIsLoading(false);
      setShowWarningModal(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={handleUpgradeClick}
        disabled={isLoading || authLoading}
      >
        {isLoading || authLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {authLoading ? "Checking..." : "Processing..."}
          </>
        ) : (
          children
        )}
      </Button>

      {/* Warning Modal before redirect to Mayar */}
      <PaymentWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleConfirmPayment}
        isLoading={isLoading}
      />

      <PaymentNotification
        isOpen={notificationState.isOpen}
        status={notificationState.status}
        message={notificationState.message}
        onClose={closeNotification}
        onRetry={handleUpgradeClick}
        onUpgrade={handleUpgradeClick}
      />
    </>
  );
}
