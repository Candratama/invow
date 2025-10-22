"use client";

import { useState } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { Invoice, StoreSettings } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InvoicePreviewProps {
  invoice: Invoice;
  storeSettings: StoreSettings | null;
  onDownload: () => void;
  isGenerating: boolean;
}

export function InvoicePreview({
  invoice,
  storeSettings,
  onDownload,
  isGenerating,
}: InvoicePreviewProps) {
  const {
    customer,
    items,
    subtotal,
    shippingCost,
    total,
    invoiceNumber,
    invoiceDate,
  } = invoice;
  const brandColor = storeSettings?.brandColor || "#d4af37";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Container */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div
          id="invoice-content"
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Invoice Content */}
          <div className="p-6 md:p-8">
            {/* Header */}
            <div
              className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: brandColor }}
            >
              <div className="flex gap-4 items-center">
                {storeSettings?.logo && (
                  <img
                    src={storeSettings.logo}
                    alt="Store Logo"
                    className="w-20 h-20 object-contain flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                    {storeSettings?.name || "Your Store Name"}
                  </h2>
                  <div className="text-sm text-gray-600">
                    <p>{storeSettings?.address || "Store Address"}</p>
                    <p>
                      WhatsApp: {storeSettings?.whatsapp || "+62 XXX XXX XXX"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right mr-4 flex flex-col justify-center">
                <h1
                  className="text-4xl font-bold mb-0 leading-tight"
                  style={{ color: brandColor }}
                >
                  INVOICE
                </h1>
                <div className="text-sm text-gray-600 space-y-0">
                  <p>
                    <strong className="text-gray-900">Invoice #:</strong>{" "}
                    {invoiceNumber}
                  </p>
                  <p>
                    <strong className="text-gray-900">Date:</strong>{" "}
                    {formatDate(new Date(invoiceDate))}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Section */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Bill To:
              </h3>
              <div
                className="bg-gray-50 p-4 rounded-lg border-l-4"
                style={{ borderLeftColor: brandColor }}
              >
                <p className="font-semibold text-gray-900 mb-1">
                  {customer.name}
                </p>
                {customer.address && (
                  <p className="text-sm text-gray-600 mt-1">
                    {customer.address}
                  </p>
                )}
                {customer.status && (
                  <p className="text-sm text-gray-600 mt-1">
                    Status: {customer.status}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table - Mobile Optimized */}
            <div className="mb-8 overflow-x-auto rounded-lg">
              <table className="w-full ">
                <thead
                  className="text-white "
                  style={{ backgroundColor: brandColor }}
                >
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">
                      No
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">
                      Description
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase hidden sm:table-cell">
                      Qty
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase hidden sm:table-cell">
                      Price
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="border-b">
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-3 text-sm">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-600 sm:hidden">
                          {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-sm hidden sm:table-cell">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right text-sm hidden sm:table-cell">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8 px-2 relative">
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Ongkos Kirim:</span>
                  <span className="font-medium">
                    {formatCurrency(shippingCost)}
                  </span>
                </div>
                <div
                  className="flex justify-between py-3 border-t-2"
                  style={{ borderColor: brandColor }}
                >
                  <span className="text-xl font-bold">Total:</span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: brandColor }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer with Signature */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-start">
                {/* Left: Greeting */}
                <div className="text-left">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: brandColor }}
                  >
                    Terus berinvestasi untuk masa depan,
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: brandColor }}
                  >
                    Terima kasih!
                  </p>
                </div>

                {/* Right: Signature */}
                {storeSettings?.adminName && (
                  <div className="text-center mr-4">
                    <p className="text-sm text-gray-700 mb-6">Hormat Kami</p>
                    <p
                      className="text-4xl font-medium mb-3"
                      style={{
                        fontFamily: "'Brush Script MT', 'Windsong', cursive",
                        color: brandColor,
                      }}
                    >
                      {storeSettings.adminName}
                    </p>
                    <div className="border-t-2 border-gray-900 w-48"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions - Green Zone */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={onDownload}
            disabled={isGenerating}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={20} />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
