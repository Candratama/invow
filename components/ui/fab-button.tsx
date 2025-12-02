"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FABButton({
  onClick,
  icon,
  className,
  disabled,
}: FABButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "fixed bottom-6 right-6 w-fab h-fab bg-primary hover:bg-yellow-600 active:bg-yellow-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50 touch-manipulation font-medium",
        "hover:scale-105 active:scale-95",
        disabled &&
          "opacity-50 cursor-not-allowed hover:scale-100 active:scale-100",
        className
      )}
      aria-label="Create new invoice"
    >
      {icon || <Plus size={28} strokeWidth={2.5} />}
    </button>
  );
}
