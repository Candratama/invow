"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PaymentNotification from "@/components/features/payment/notification";
import { usePaymentNotification } from "@/lib/hooks/use-payment-notification";
import { usePaymentVerificationStore } from "@/lib/stores/payment-verification-store";

/**
 * Component to handle payment success/failure notifications based on URL parameters
 * Usage: Add this component to pages where users might return after payment
 * 
 * Expected URL parameters:
 * - payment_status: "success" | "failed" (legacy)
 * - payment_message: Optional custom message (legacy)
 * - payment_redirect: "true" (new redirect flow from Mayar)
 * - payment_id: Payment record ID for verification (new redirect flow)
 */
interface PaymentSuccessHandlerProps {
  onPaymentSuccess?: () => void; // Callback when payment succeeds
  onPaymentVerifying?: () => void; // Callback when verification starts
}

export default function PaymentSuccessHandler({
  onPaymentSuccess,
  onPaymentVerifying,
}: PaymentSuccessHandlerProps = {}) {
  const searchParams = useSearchParams();
  const { notificationState, showSuccess, showFailure, closeNotification } =
    usePaymentNotification();
  
  // Use Zustand store for payment verification state
  const {
    startVerification,
    completeVerification,
    failVerification,
    isVerifying,
    isVerified,
  } = usePaymentVerificationStore();

  /**
   * Verify payment with backend API
   * Handles the new redirect-based payment flow from Mayar
   */
  const verifyPayment = useCallback(async (paymentId: string) => {
    // Try to start verification (returns false if already verifying or verified)
    if (!startVerification(paymentId)) {
      return;
    }
    
    // Notify parent component that verification is starting
    if (onPaymentVerifying) {
      onPaymentVerifying();
    }

    // Show verifying notification
    showSuccess("Verifying payment...");

    try {
      // Set timeout for API call (30 seconds to account for retries)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ paymentId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorMsg = "Payment verification failed due to a server error. Please refresh the page or contact support.";
        console.error("[Payment Verification] Non-JSON response received:", {
          status: response.status,
          contentType,
        });
        failVerification(paymentId, errorMsg);
        showFailure(errorMsg);
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Success: Mark as verified and show success message
        completeVerification(paymentId);
        
        const successMessage = data.message || 
          "Payment verified successfully! Your subscription has been upgraded.";
        
        showSuccess(successMessage);
        
        // Trigger callback to refresh subscription data
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        // API returned error
        let errorMessage = data.error || "Payment verification failed. Please try again.";
        
        // Special handling for rate limiting
        if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
          errorMessage = "Too many verification attempts. Please wait a moment and refresh the page to try again.";
        }
        
        failVerification(paymentId, errorMessage);
        showFailure(errorMessage);
      }
    } catch (error) {
      // Handle network errors and timeouts
      console.error("[Payment Verification] Error:", error);
      
      let errorMessage = "An unexpected error occurred while verifying payment.";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Payment verification is taking longer than expected. Please refresh the page to try again.";
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = "Unable to connect to verification service. Please check your internet connection and refresh the page.";
        } else if (error.message.includes('JSON')) {
          errorMessage = "Received invalid response from server. Please refresh the page or contact support.";
        } else {
          errorMessage = `Verification error: ${error.message}. Please refresh the page or contact support.`;
        }
      }
      
      failVerification(paymentId, errorMessage);
      showFailure(errorMessage);
    }
  }, [startVerification, completeVerification, failVerification, onPaymentVerifying, onPaymentSuccess, showSuccess, showFailure]);

  useEffect(() => {
    const handlePaymentRedirect = async () => {
      // Check for new redirect-based flow from Mayar
      const paymentRedirect = searchParams.get("payment_redirect");
      const paymentId = searchParams.get("payment_id");

      if (paymentRedirect === "true") {
        // Handle redirect from Mayar
        if (!paymentId) {
          // Missing payment ID - show error
          showFailure(
            "Invalid payment link. Missing payment information. Please contact support if you completed a payment."
          );
          return;
        }

        // Check if already verified or verifying (Zustand store handles this)
        if (isVerified(paymentId)) {
          console.log(`[Payment Verification] Payment ${paymentId.substring(0, 8)}... already verified, showing success`);
          showSuccess("Payment already verified! Your subscription is active.");
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
          return;
        }

        if (isVerifying(paymentId)) {
          console.log(`[Payment Verification] Payment ${paymentId.substring(0, 8)}... is currently being verified`);
          return;
        }

        // Verify payment with backend using our payment record ID
        await verifyPayment(paymentId);
        return;
      }

      // Legacy flow: Check for old payment_status parameter
      const paymentStatus = searchParams.get("payment_status");
      const paymentMessage = searchParams.get("payment_message");

      if (paymentStatus === "success") {
        showSuccess(
          paymentMessage ||
            "Payment successful! Your subscription has been upgraded."
        );
        // Trigger callback to refresh subscription data
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else if (paymentStatus === "failed") {
        showFailure(
          paymentMessage || "Payment failed. Please try again or contact support."
        );
      }
    };
    
    handlePaymentRedirect();
    // Only run when searchParams changes, not when callbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <PaymentNotification
      isOpen={notificationState.isOpen}
      status={notificationState.status}
      message={notificationState.message}
      onClose={closeNotification}
      autoDismiss={notificationState.status === "success"}
      autoDismissDelay={5000}
    />
  );
}
