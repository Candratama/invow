"use client";

import { useState, useCallback } from "react";
import { PaymentStatus } from "@/components/features/payment/notification";

interface PaymentNotificationState {
  isOpen: boolean;
  status: PaymentStatus;
  message?: string;
}

interface UsePaymentNotificationReturn {
  notificationState: PaymentNotificationState;
  showSuccess: (message?: string) => void;
  showFailure: (message?: string) => void;
  closeNotification: () => void;
}

export function usePaymentNotification(): UsePaymentNotificationReturn {
  const [notificationState, setNotificationState] =
    useState<PaymentNotificationState>({
      isOpen: false,
      status: "success",
      message: undefined,
    });

  const showSuccess = useCallback((message?: string) => {
    setNotificationState({
      isOpen: true,
      status: "success",
      message,
    });
  }, []);

  const showFailure = useCallback((message?: string) => {
    setNotificationState({
      isOpen: true,
      status: "failure",
      message,
    });
  }, []);

  const closeNotification = useCallback(() => {
    setNotificationState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    notificationState,
    showSuccess,
    showFailure,
    closeNotification,
  };
}
