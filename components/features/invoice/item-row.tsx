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
      {/* Delete button (revealed on swipe) */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-transform",
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
          swiped ? "-translate-x-20" : "translate-x-0"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-medium text-foreground truncate mb-1">
              {item.description}
            </h4>
            <p className="text-sm text-muted-foreground">
              {item.quantity} × {formatCurrency(item.price)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(item.subtotal)}
              </p>
            </div>

            <button
              onClick={() => onEdit(item)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
              aria-label="Edit item"
            >
              <Edit2 size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
