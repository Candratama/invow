"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PaymentNotification from "@/components/features/payment/notification";
import { usePaymentNotification } from "@/lib/hooks/use-payment-notification";
import { createClient } from "@/lib/supabase/client";

interface UpgradeButtonProps {
  tier: "starter" | "pro";
  variant?: "default" | "outline";
  className?: string;
  children?: React.ReactNode;
  requireAuth?: boolean; // If true, check auth before proceeding
}

interface CreateInvoiceResponse {
  success: boolean;
  mayarInvoiceId: string;
  paymentUrl: string;
  amount: number;
  tier: string;
  error?: string;
}

export default function UpgradeButton({
  tier,
  variant = "default",
  className = "",
  children = "Upgrade Now",
  requireAuth = true,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const router = useRouter();
  const { notificationState, showFailure, closeNotification } =
    usePaymentNotification();

  // Auto-trigger upgrade if specified in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const autoUpgrade = params.get('autoUpgrade');
      if (autoUpgrade === tier && !isLoading) {
        // Remove the parameter and trigger upgrade
        params.delete('autoUpgrade');
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        handleUpgrade();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (requireAuth) {
        setIsCheckingAuth(true);
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        setIsCheckingAuth(false);

        if (authError || !user) {
          // User not logged in, redirect to signup with return URL that includes autoUpgrade
          const returnUrl = `/dashboard/account?autoUpgrade=${tier}`;
          router.push(`/dashboard/signup?returnUrl=${encodeURIComponent(returnUrl)}`);
          setIsLoading(false);
          return;
        }
      }

      // Call the create-invoice API endpoint
      const response = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });

      const data: CreateInvoiceResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment invoice");
      }

      // Redirect to Mayar payment URL on success
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showFailure(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={handleUpgrade}
        disabled={isLoading || isCheckingAuth}
      >
        {isLoading || isCheckingAuth ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isCheckingAuth ? "Checking..." : "Processing..."}
          </>
        ) : (
          children
        )}
      </Button>

      <PaymentNotification
        isOpen={notificationState.isOpen}
        status={notificationState.status}
        message={notificationState.message}
        onClose={closeNotification}
        onRetry={handleUpgrade}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}
