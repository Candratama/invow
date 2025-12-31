"use client";

import React, { useEffect, useState } from "react";
import { Download, Loader2, Eye } from "lucide-react";
import { Invoice, StoreSettings } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { getPreferencesAction } from "@/app/actions/preferences";

import { DEFAULT_BRAND_COLOR } from "./types";

interface InvoicePreviewProps {
  invoice: Invoice;
  storeSettings: StoreSettings | null;
  onDownloadJPEG: () => void;
  isGenerating: boolean;
  /** User's subscription tier - defaults to 'free' */
  tier?: string;
}

export function InvoicePreview({
  invoice,
  storeSettings,
  onDownloadJPEG,
  isGenerating,
  tier = "free",
}: InvoicePreviewProps) {
  const {
    customer,
    items,
    subtotal,
    shippingCost,
    invoiceNumber,
    invoiceDate,
  } = invoice;

  // State for tax preferences
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch user preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const result = await getPreferencesAction();
        if (result.success && result.data) {
          setTaxEnabled(result.data.tax_enabled);
          setTaxPercentage(result.data.tax_percentage ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      }
    };

    fetchPreferences();
  }, []);

  // Calculate tax and total
  const calculation = calculateTotal(
    subtotal,
    shippingCost,
    taxEnabled,
    taxPercentage
  );

  const total = calculation.total;
  const taxAmount = calculation.taxAmount;

  // Show loading state while storeSettings is being fetched
  if (storeSettings === null) {
    return (
      <div className="min-h-screen bg-gray-100 lg:bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading store settings...</p>
        </div>
      </div>
    );
  }

  // Free users always use default gold color, premium users can customize
  const brandColor =
    tier === "premium"
      ? storeSettings.brandColor || DEFAULT_BRAND_COLOR
      : DEFAULT_BRAND_COLOR;

  const splitCurrency = (value: number) => {
    const normalized = formatCurrency(value)
      .replace(/\u00A0/g, " ")
      .trim();
    const [symbol, ...rest] = normalized.split(" ");
    const amount = rest.join(" ").trim();
    return {
      symbol: symbol || "Rp",
      amount: amount || normalized.replace(symbol || "", "").trim(),
    };
  };
  const subtotalCurrency = splitCurrency(subtotal);
  const shippingCurrency = splitCurrency(shippingCost);
  const totalCurrency = splitCurrency(total);
  const adminTitle = storeSettings?.adminTitle?.trim() || "Admin Store";
  const contactLine = [storeSettings?.whatsapp, storeSettings?.email]
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
    .join(" | ");

  return (
    <div className="min-h-screen bg-gray-100 lg:bg-gray-50">
      {/* Preview Container */}
      <div className="max-w-5xl mx-auto p-4 pb-20 lg:p-8 lg:pb-24">
        {/* Desktop: Paper-like container with shadow */}
        <div className="lg:bg-white lg:rounded-lg lg:shadow-xl lg:p-8">
          <div
            id="invoice-content"
            className="bg-white lg:shadow-sm lg:border lg:border-gray-200"
            style={{
              width: "100%",
              maxWidth: "794px", // A4 width in pixels at 96 DPI
              margin: "0 auto",
              padding: "40px",
              fontSize: "12pt",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "15px",
                borderBottom: `2px solid ${brandColor}`,
              }}
            >
              <div
                style={{ display: "flex", width: "60%", alignItems: "center" }}
              >
                {storeSettings?.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storeSettings.logo}
                    alt="Store Logo"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      marginRight: "12px",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "19pt",
                      fontWeight: "bold",
                      color: "#111827",
                      marginBottom: "2px",
                    }}
                  >
                    {storeSettings?.name || "Your Store Name"}
                  </div>
                  {storeSettings?.storeDescription && (
                    <div
                      style={{
                        fontSize: "11pt",
                        color: "#374151",
                      }}
                    >
                      {storeSettings.storeDescription}
                    </div>
                  )}
                  {storeSettings?.storeNumber && (
                    <div
                      style={{
                        fontSize: "10pt",
                        color: "#111827",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>No ID:</span>{" "}
                      {storeSettings.storeNumber}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "10pt",
                      color: "#6b7280",
                      display: "grid",
                      gap: "4px",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {storeSettings?.address || "Store Address"}
                    </div>
                    <div>
                      WhatsApp: {storeSettings?.whatsapp || "+62 XXX XXX XXX"}
                    </div>
                    {storeSettings?.email && (
                      <div>Email: {storeSettings.email}</div>
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "40%",
                  textAlign: "right",
                  paddingRight: "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  className="text-2xl lg:text-3xl font-bold"
                  style={{
                    color: brandColor,
                    marginBottom: "5px",
                  }}
                >
                  INVOICE
                </div>
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#6b7280",
                    lineHeight: "1.5",
                  }}
                >
                  <div>
                    <span style={{ color: "#111827", fontWeight: "bold" }}>
                      Invoice #:
                    </span>{" "}
                    {invoiceNumber}
                  </div>
                  <div>
                    <span style={{ color: "#111827", fontWeight: "bold" }}>
                      Date:
                    </span>{" "}
                    {formatDate(new Date(invoiceDate))}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Section */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "10pt",
                  fontWeight: "bold",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                Bill To:
              </div>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "12px",
                  borderRadius: "6px",
                  borderLeft: `3px solid ${brandColor}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  className="text-base font-bold"
                  style={{
                    color: "#111827",
                    marginBottom: "4px",
                  }}
                >
                  {customer.name}
                </div>
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#6b7280",
                    lineHeight: "1.4",
                  }}
                >
                  <div>{customer.address || "No address provided"}</div>
                  {customer.status && <div>Status: {customer.status}</div>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: "20px" }}>
              <div
                className="text-sm font-medium"
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: brandColor,
                  padding: "8px",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                <div style={{ width: "8%", textAlign: "center" }}>No</div>
                <div style={{ width: "44%", textAlign: "left" }}>
                  Description
                </div>
                <div style={{ width: "12%", textAlign: "center" }}>Qty</div>
                <div style={{ width: "18%", textAlign: "right" }}>Price</div>
                <div style={{ width: "18%", textAlign: "right" }}>Subtotal</div>
              </div>
              {items.map((item, index) => {
                const { symbol: priceSymbol, amount: priceAmount } =
                  splitCurrency(item.price || 0);
                const { symbol: subtotalSymbol, amount: subtotalAmount } =
                  splitCurrency(item.subtotal || 0);

                return (
                  <div
                    key={item.id}
                    className="text-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px",
                      backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                    }}
                  >
                    <div
                      className="text-xs text-gray-500"
                      style={{ width: "8%", textAlign: "center" }}
                    >
                      {index + 1}
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{
                        width: "44%",
                        color: "#111827",
                      }}
                    >
                      {item.description}
                    </div>
                    <div style={{ width: "12%", textAlign: "center" }}>
                      {item.quantity}
                    </div>
                    <div
                      style={{
                        width: "18%",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "6px",
                        paddingLeft: "8px",
                        paddingRight: "8px",
                      }}
                    >
                      <span>{priceSymbol}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>
                        {priceAmount}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "18%",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "6px",
                        paddingLeft: "8px",
                        paddingRight: "8px",
                      }}
                    >
                      <span>{subtotalSymbol}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>
                        {subtotalAmount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note & Totals */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "stretch",
                marginBottom: "24px",
                marginRight: invoice.note ? "0" : "16px",
              }}
            >
              {invoice.note && (
                <div
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    borderLeft: `3px solid ${brandColor}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10pt",
                      fontWeight: "bold",
                      color: "#6b7280",
                      marginBottom: "6px",
                    }}
                  >
                    Note:
                  </div>
                  <div
                    style={{
                      fontSize: "10pt",
                      color: "#374151",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {invoice.note}
                  </div>
                </div>
              )}

              <div
                style={{
                  width: "240px",
                  marginLeft: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    fontSize: "12pt",
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <span>Subtotal:</span>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "140px",
                    }}
                  >
                    <span>{subtotalCurrency.symbol}</span>
                    <span style={{ flex: 1, textAlign: "right" }}>
                      {subtotalCurrency.amount}
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    fontSize: "10pt",
                    color: "#6b7280",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <span>Shipping:</span>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "140px",
                    }}
                  >
                    <span>{shippingCurrency.symbol}</span>
                    <span style={{ flex: 1, textAlign: "right" }}>
                      {shippingCurrency.amount}
                    </span>
                  </span>
                </div>
                {taxEnabled && taxPercentage > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "6px",
                      paddingBottom: "6px",
                      fontSize: "10pt",
                      color: "#6b7280",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <span>Tax ({taxPercentage}%):</span>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        minWidth: "140px",
                      }}
                    >
                      <span>{splitCurrency(taxAmount).symbol}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>
                        {splitCurrency(taxAmount).amount}
                      </span>
                    </span>
                  </div>
                )}
                <div
                  className="text-base lg:text-lg font-semibold"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: `2px solid ${brandColor}`,
                  }}
                >
                  <span>Total:</span>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "140px",
                      color: brandColor,
                    }}
                  >
                    <span>{totalCurrency.symbol}</span>
                    <span style={{ flex: 1, textAlign: "right" }}>
                      {totalCurrency.amount}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb",
                marginTop: "20px",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  maxWidth: "65%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  color: "#374151",
                }}
              >
                {storeSettings?.paymentMethod && (
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: brandColor,
                        marginBottom: "4px",
                      }}
                    >
                      Metode Pembayaran:
                    </div>
                    <div>{storeSettings.paymentMethod}</div>
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: brandColor,
                      marginBottom: "4px",
                    }}
                  >
                    Kontak:
                  </div>
                  <div>{storeSettings?.address || "Store Address"}</div>
                  <div>{contactLine || "-"}</div>
                </div>
                {storeSettings?.tagline && (
                  <div
                    style={{
                      fontStyle: "italic",
                      color: brandColor,
                      marginTop: "4px",
                    }}
                  >
                    {storeSettings.tagline}
                  </div>
                )}
              </div>

              {storeSettings?.adminName && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    minWidth: "180px",
                    marginRight: "0",
                  }}
                >
                  {storeSettings.signature && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storeSettings.signature}
                      alt="Admin signature"
                      style={{
                        maxWidth: "180px",
                        height: "auto",
                        maxHeight: "80px",
                        objectFit: "contain",
                        objectPosition: "right",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontFamily: "'Brush Script MT', cursive",
                      fontSize: "38pt",
                      color: brandColor,
                      marginBottom: "8px",
                      fontWeight: 400,
                      textAlign: "right",
                      width: "100%",
                    }}
                  >
                    {storeSettings.adminName}
                  </div>
                  <div
                    style={{
                      borderTop: "2px solid #111827",
                      width: "150px",
                      marginTop: "5px",
                    }}
                  />
                  {adminTitle && (
                    <div
                      style={{
                        fontSize: "10pt",
                        color: "#374151",
                        marginTop: "8px",
                        textAlign: "right",
                        width: "100%",
                      }}
                    >
                      {adminTitle}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      {/* Download Button - Fixed at bottom on mobile, centered on desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 lg:static lg:border-t-0 lg:mt-8 lg:p-0">
        <div className="max-w-5xl mx-auto lg:max-w-md">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={isGenerating}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Eye size={20} />
                    Review & Download
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Invoice Details</DialogTitle>
                <DialogDescription>
                  Please review the invoice details before downloading
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {/* Invoice Info */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-semibold">
                      {formatDate(new Date(invoiceDate))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-semibold">{customer.name}</p>
                    {customer.address && (
                      <p className="text-xs text-gray-600">
                        {customer.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">
                    Items ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-start text-sm"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium truncate">
                            {item.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × {formatCurrency(item.price || 0)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold whitespace-nowrap">
                          {formatCurrency(item.subtotal || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {formatCurrency(shippingCost)}
                    </span>
                  </div>
                  {taxEnabled && taxPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Tax ({taxPercentage}%)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-1.5 border-t border-gray-300">
                    <span>Total</span>
                    <span style={{ color: brandColor }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Note if exists */}
                {invoice.note && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Note
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {invoice.note}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    onDownloadJPEG();
                  }}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download JPEG
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
