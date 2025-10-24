"use client";

import { Download, Loader2 } from "lucide-react";
import { Invoice, StoreSettings } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InvoicePreviewProps {
  invoice: Invoice;
  storeSettings: StoreSettings | null;
  onDownloadJPEG: () => void;
  isGenerating: boolean;
}

export function InvoicePreview({
  invoice,
  storeSettings,
  onDownloadJPEG,
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
    <div className="min-h-screen bg-gray-100">
      {/* Preview Container */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div
          id="invoice-content"
          className="bg-white"
          style={{
            width: "794px", // A4 width in pixels at 96 DPI
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
                  <div>{storeSettings?.address || "Store Address"}</div>
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
                style={{
                  fontSize: "31pt",
                  fontWeight: "bold",
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
                style={{
                  fontSize: "15pt",
                  fontWeight: "bold",
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
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: brandColor,
                padding: "8px",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "10pt",
                textTransform: "uppercase",
              }}
            >
              <div style={{ width: "8%", textAlign: "center" }}>No</div>
              <div style={{ width: "44%", textAlign: "left" }}>Description</div>
              <div style={{ width: "12%", textAlign: "center" }}>Qty</div>
              <div style={{ width: "18%", textAlign: "right" }}>Price</div>
              <div style={{ width: "18%", textAlign: "right" }}>Subtotal</div>
            </div>
            {items.map((item, index) => {
              const { symbol: priceSymbol, amount: priceAmount } =
                splitCurrency(item.price);
              const { symbol: subtotalSymbol, amount: subtotalAmount } =
                splitCurrency(item.subtotal);

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                    fontSize: "11pt",
                    backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                  }}
                >
                  <div style={{ width: "8%", textAlign: "center" }}>
                    {index + 1}
                  </div>
                  <div
                    style={{
                      width: "44%",
                      fontWeight: "bold",
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  fontSize: "19pt",
                  fontWeight: "bold",
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
                  textAlign: "right",
                  minWidth: "150px",
                  marginRight: "10px",
                }}
              >
                {storeSettings.signature && (
                  <img
                    src={storeSettings.signature}
                    alt="Admin signature"
                    style={{
                      width: "180px",
                      height: "80px",
                      objectFit: "contain",
                      margin: "0 auto 8px auto",
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
                  }}
                >
                  {storeSettings.adminName}
                </div>
                <div
                  style={{
                    borderTop: "2px solid #111827",
                    width: "150px",
                    marginTop: "5px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                />
                {adminTitle && (
                  <div
                    style={{
                      fontSize: "10pt",
                      color: "#374151",
                      marginTop: "8px",
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

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={onDownloadJPEG}
            disabled={isGenerating}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={20} />
                Download JPEG
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
