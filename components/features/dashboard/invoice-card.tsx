"use client";

import { CheckCircle, Trash2, TrendingUp, ShoppingCart } from "lucide-react";
import { Invoice } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";

interface InvoiceCardProps {
  invoice: Invoice;
  onOpen: (invoiceId: string) => void;
  onDelete: (e: React.MouseEvent, invoiceId: string) => void;
}

export function InvoiceCard({ invoice, onOpen, onDelete }: InvoiceCardProps) {
  // Determine if this is a buyback invoice (all items must be buyback)
  const isBuyback = invoice.items?.length > 0 && invoice.items.every((item) => item.is_buyback === true);

  return (
    <div className="relative border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Top row: Icons - Absolute positioned */}
      <div className="absolute top-1 right-1 flex items-center gap-2 z-10">
        {isBuyback ? (
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-50">
            <ShoppingCart size={18} className="text-amber-600" />
          </div>
        ) : (
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50">
            <TrendingUp size={18} className="text-green-600" />
          </div>
        )}
        <button
          onClick={(e) => onDelete(e, invoice.id)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 text-red-600 transition-colors"
          aria-label="Delete invoice"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Main content */}
      <button
        onClick={() => onOpen(invoice.id)}
        className="w-full text-left py-3 px-4"
      >
        <div className="text-base lg:text-lg font-bold text-gray-900 truncate mb-1 pr-20">
          {invoice.customer.name || "No customer"}
        </div>
        <div className="text-sm lg:text-base text-gray-600 truncate mb-2">
          {invoice.invoiceNumber}
        </div>

        {/* Bottom row: Date and Amount aligned */}
        <div className="flex items-center justify-between">
          <div className="text-xs lg:text-sm text-gray-500">
            {invoice.items?.length || 0} item
            {invoice.items?.length !== 1 ? "s" : ""} •{" "}
            {formatDate(invoice.invoiceDate)}
          </div>
          <div className="text-sm lg:text-base font-medium text-gray-900">
            {formatCurrency(invoice.total || 0)}
          </div>
        </div>
      </button>
    </div>
  );
}
