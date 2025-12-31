"use client";

import { useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
import { InvoiceItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ItemRowProps {
  item: InvoiceItem;
  onEdit: (item: InvoiceItem) => void;
  onDelete: (id: string) => void;
}

export function ItemRow({ item, onEdit, onDelete }: ItemRowProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe) {
      setSwiped(true);
    } else if (distance < -minSwipeDistance) {
      setSwiped(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white border border-gray-200 rounded-lg mb-3">
      {/* Floating action buttons - top right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button
          onClick={() => onEdit(item)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Edit item"
        >
          <Edit2 size={18} className="text-gray-500" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 transition-colors"
          aria-label="Delete item"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      {/* Delete button (revealed on swipe for mobile) */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-transform md:hidden",
          swiped ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={() => onDelete(item.id)}
          className="w-full h-full flex items-center justify-center text-white"
          aria-label="Delete item"
        >
          <Trash2 size={24} />
        </button>
      </div>

      {/* Item content */}
      <div
        className={cn(
          "relative bg-white p-4 transition-transform touch-pan-y",
          swiped ? "-translate-x-20 md:translate-x-0" : "translate-x-0"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="pr-16">
          <h4 className="text-base font-medium text-foreground truncate mb-1">
            {item.description}
          </h4>
          {item.is_buyback ? (
            /* Buyback Item Display */
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {item.gram}g × {formatCurrency(item.buyback_rate || 0)}/gram
              </p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(item.total || 0)}
              </p>
            </>
          ) : (
            /* Regular Item Display */
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {item.quantity} × {formatCurrency(item.price || 0)}
              </p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(item.subtotal || 0)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
