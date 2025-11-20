"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaymentStatus = "success" | "failure";

interface PaymentNotificationProps {
  isOpen: boolean;
  status: PaymentStatus;
  message?: string;
  onClose: () => void;
  onRetry?: () => void;
  onUpgrade?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number; // in milliseconds
}

export default function PaymentNotification({
  isOpen,
  status,
  message,
  onClose,
  onRetry,
  onUpgrade,
  autoDismiss = true,
  autoDismissDelay = 5000,
}: PaymentNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Handle auto-dismiss
  useEffect(() => {
    if (isOpen && autoDismiss) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismiss, autoDismissDelay, handleClose]);

  // Handle animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuccess = status === "success";
  const defaultMessage = isSuccess
    ? "Payment successful! Your subscription has been upgraded."
    : "Payment failed. Please try again or contact support.";

  return (
    <>
      {/* Backdrop - only for mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-[60] md:hidden"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Toast Container */}
      <div
        className={cn(
          "fixed z-[60] w-full max-w-md mx-auto transition-all duration-300 ease-out",
          // Mobile: Bottom toast
          "bottom-4 left-4 right-4",
          // Desktop: Top-right toast
          "md:top-4 md:bottom-auto md:left-auto md:right-4",
          // Animation
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0 md:translate-y-0 md:-translate-x-2",
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div
          className={cn(
            "rounded-lg shadow-lg border-2 p-4 bg-white",
            isSuccess
              ? "border-green-500"
              : "border-red-500",
          )}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "text-sm font-semibold mb-1",
                  isSuccess ? "text-green-900" : "text-red-900",
                )}
              >
                {isSuccess ? "Payment Successful" : "Payment Failed"}
              </h3>
              <p className="text-sm text-gray-700">
                {message || defaultMessage}
              </p>

              {/* Action Buttons */}
              {!isSuccess && (onRetry || onUpgrade) && (
                <div className="mt-3 flex gap-2">
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleClose();
                        onRetry();
                      }}
                      className="text-xs h-8"
                    >
                      Retry Payment
                    </Button>
                  )}
                  {onUpgrade && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        handleClose();
                        onUpgrade();
                      }}
                      className="text-xs h-8"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
