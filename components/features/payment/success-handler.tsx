"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PaymentNotification from "@/components/features/payment/notification";
import { usePaymentNotification } from "@/lib/hooks/use-payment-notification";

/**
 * Component to handle payment success/failure notifications based on URL parameters
 * Usage: Add this component to pages where users might return after payment
 * 
 * Expected URL parameters:
 * - payment_status: "success" | "failed"
 * - payment_message: Optional custom message
 */
interface PaymentSuccessHandlerProps {
  onPaymentSuccess?: () => void; // Callback when payment succeeds
}

export default function PaymentSuccessHandler({
  onPaymentSuccess,
}: PaymentSuccessHandlerProps = {}) {
  const searchParams = useSearchParams();
  const { notificationState, showSuccess, showFailure, closeNotification } =
    usePaymentNotification();

  useEffect(() => {
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
  }, [searchParams, showSuccess, showFailure, onPaymentSuccess]);

  return (
    <PaymentNotification
      isOpen={notificationState.isOpen}
      status={notificationState.status}
      message={notificationState.message}
      onClose={closeNotification}
    />
  );
}
