"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullScreen?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  fullScreen = false,
  maxWidth = "md",
}: BottomSheetProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "lg:max-w-sm",
    md: "lg:max-w-md",
    lg: "lg:max-w-lg",
    xl: "lg:max-w-xl",
    "2xl": "lg:max-w-2xl",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Responsive behavior */}
      <div
        className={cn(
          "fixed z-50",
          // Mobile: Bottom sheet
          "bottom-0 left-0 right-0 max-h-[90vh]",
          "rounded-t-2xl shadow-2xl",
          "animate-in slide-in-from-bottom duration-300",
          // Desktop: Centered modal
          "lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
          "lg:bottom-auto lg:right-auto lg:max-h-[90vh]",
          "lg:rounded-2xl lg:animate-in lg:zoom-in-95 lg:slide-in-from-bottom-0",
          "lg:w-full lg:mx-4",
          maxWidthClasses[maxWidth],
          // Full screen override for mobile and desktop
          fullScreen && "top-0 rounded-t-none max-h-screen lg:max-h-[95vh]",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white h-full flex flex-col lg:rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between flex-shrink-0 z-10 lg:px-6">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-gray-900 lg:text-2xl"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div
            className={cn(
              "overflow-y-auto flex-1 px-4 lg:px-6",
              fullScreen ? "pb-safe" : "pb-4",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
