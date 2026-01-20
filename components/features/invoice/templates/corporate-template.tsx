"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

/**
 * Corporate Invoice Template
 *
 * A formal and professional invoice template with:
 * - Very structured layout
 * - Traditional business look
 * - Table-heavy design
 * - Professional color scheme
 * - Formal typography
 */
export function CorporateInvoiceTemplate({
  invoice,
  storeSettings,
  preview = false,
  taxEnabled = false,
  taxPercentage = 0,
  tier = "free",
}: InvoiceTemplateProps) {
  const {
    customer,
    items,
    subtotal,
    shippingCost,
    invoiceNumber,
    invoiceDate,
  } = invoice;

  // Check if this is a buyback invoice
  const isBuybackInvoice = items.some(item => item.is_buyback);

  // Format invoice number for buyback
  const displayNumber = isBuybackInvoice
    ? invoiceNumber.replace(/^INV-/, 'BUY-')
    : invoiceNumber;

  const calculation = calculateTotal(
    subtotal,
    shippingCost,
    taxEnabled,
    taxPercentage
  );

  // Free users always use primary color, premium users can customize
  const brandColor =
    tier === "premium"
      ? storeSettings?.brandColor || DEFAULT_BRAND_COLOR
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
  const subtotalCurrency = splitCurrency(calculation.subtotal);
  const taxCurrency = splitCurrency(calculation.taxAmount);
  const shippingCurrency = splitCurrency(calculation.shippingCost);
  const totalCurrency = splitCurrency(calculation.total);

  return (
    <div
      style={
        preview
          ? {
              position: "relative",
              display: "flex",
              justifyContent: "center",
              padding: "32px",
              backgroundColor: "#f3f4f6",
            }
          : { position: "fixed", left: "-9999px", top: 0 }
      }
    >
      <div
        id="invoice-content"
        style={{
          width: "794px",
          padding: "50px 50px",
          fontSize: "10pt",
          fontFamily: "Arial, Helvetica, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          lineHeight: "1.2",
          wordSpacing: "normal",
          letterSpacing: "normal",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "12px",
              }
            : {}),
        }}
      >
        {/* Letterhead */}
        <div
          style={{
            borderBottom: `3px solid ${brandColor}`,
            paddingBottom: "20px",
            marginBottom: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {storeSettings?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storeSettings.logo}
                  alt="Company Logo"
                  style={{
                    height: "80px",
                    width: "auto",
                    maxWidth: "100px",
                    objectFit: "contain",
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: "18pt",
                    fontWeight: "700",
                    color: brandColor,
                    alignItems: "center",
                    lineHeight: "1.2",
                  }}
                >
                  {storeSettings?.name || "Your Company Name"}
                </div>

                {storeSettings?.storeDescription && (
                  <div style={{ fontSize: "9pt", color: "#6b7280" }}>
                    {storeSettings.storeDescription}
                  </div>
                )}
                {storeSettings?.storeNumber && (
                  <div>ID: {storeSettings.storeNumber}</div>
                )}
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                fontSize: "9pt",
                color: "#6b7280",
                paddingRight: "20px",
              }}
            >
              {storeSettings?.address && (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {storeSettings.address}
                </div>
              )}
              {storeSettings?.whatsapp && (
                <div>
                  {storeSettings.whatsapp} | {storeSettings.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            border: "1px #000",
          }}
        >
          <div
            style={{
              fontSize: "20pt",
              fontWeight: "700",
              color: brandColor,
              marginBottom: "8px",
            }}
          >
            INVOICE
          </div>
          <div style={{ fontSize: "9pt", color: "#6b7280" }}>
            Invoice Number: {displayNumber}
          </div>
        </div>

        {/* Info Table */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {/* Invoice Details */}
          <div
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
            }}
          >
            <div
              style={{
                backgroundColor: brandColor,
                color: "#ffffff",
                padding: "0px 12px 12px 12px",
                fontSize: "9pt",
                fontWeight: "700",
              }}
            >
              INVOICE DETAILS
            </div>
            <div style={{ padding: "0px 12px 12px 12px", fontSize: "9pt" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontWeight: "600" }}>Invoice Date:</span>
                <span>{formatDate(new Date(invoiceDate))}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontWeight: "600" }}>Invoice Number:</span>
                <span>{displayNumber}</span>
              </div>
              {storeSettings?.storeNumber && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>Reference:</span>
                  <span>{storeSettings.storeNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
            }}
          >
            <div
              style={{
                backgroundColor: brandColor,
                color: "#ffffff",
                padding: "0px 12px 12px 12px",
                fontSize: "9pt",
                fontWeight: "700",
              }}
            >
              BILL TO
            </div>
            <div style={{ padding: "0px 12px 12px 12px", fontSize: "9pt" }}>
              <div
                style={{
                  fontWeight: "700",
                  marginBottom: "6px",
                  fontSize: "10pt",
                }}
              >
                {customer.name}
              </div>
              {customer.address && (
                <div style={{ marginBottom: "6px", color: "#6b7280" }}>
                  {customer.address}
                </div>
              )}
              {customer.status && (
                <div style={{ color: "#6b7280" }}>
                  Status: {customer.status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div
          style={{
            border: "1px solid #d1d5db",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: brandColor,
              color: "#ffffff",
              padding: "0px 12px 12px 12px",
              fontSize: "9pt",
              fontWeight: "700",
            }}
          >
            <div style={{ width: "10%", textAlign: "center" }}>NO</div>
            <div style={{ width: "44%", textAlign: "left" }}>ITEMS</div>
            <div style={{ width: "10%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "18%", textAlign: "center" }}>PRICE</div>
            <div style={{ width: "18%", textAlign: "center" }}>SUBTOTAL</div>
          </div>

          {items.map((item, index) => {
            // Handle buyback vs regular items differently
            const isBuyback = item.is_buyback;

            let qtyDisplay, priceSymbol, priceAmount, subtotalSymbol, subtotalAmount;

            if (isBuyback) {
              // Buyback item: show gram and buyback_rate
              // Buyback item: show gram × quantity if applicable
              const qty = item.quantity || 1;
              const totalGram = (item.gram || 0) * qty;

              if (qty > 1) {
                qtyDisplay = `${item.gram}g × ${qty} = ${totalGram.toFixed(3)}g`;
              } else {
                qtyDisplay = `${item.gram}g`;
              }
              const priceData = splitCurrency(item.buyback_rate || 0);
              priceSymbol = priceData.symbol;
              priceAmount = `${priceData.amount}/g`;
              const totalData = splitCurrency(item.total || 0);
              subtotalSymbol = totalData.symbol;
              subtotalAmount = totalData.amount;
            } else {
              // Regular item: show quantity and price
              qtyDisplay = item.quantity;
              const priceData = splitCurrency(item.price || 0);
              priceSymbol = priceData.symbol;
              priceAmount = priceData.amount;
              const subtotalData = splitCurrency(item.subtotal || 0);
              subtotalSymbol = subtotalData.symbol;
              subtotalAmount = subtotalData.amount;
            }

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  padding: "0px 12px 12px 12px",
                  borderBottom:
                    index < items.length - 1 ? "1px solid #e5e7eb" : "none",
                  fontSize: "9pt",
                  backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "10%",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  {index + 1}
                </div>
                <div
                  style={{
                    width: "44%",
                    fontWeight: "600",
                    textAlign: "left",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {item.description}
                </div>
                <div
                  style={{
                    width: "10%",
                    textAlign: "center",
                  }}
                >
                  {qtyDisplay}
                </div>
                <div
                  style={{
                    width: "18%",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "8px",
                    paddingLeft: "8px",
                    alignItems: "center",
                    color: "#6b7280",
                  }}
                >
                  <span>{priceSymbol}</span>
                  <span style={{ textAlign: "right", flex: 1 }}>
                    {priceAmount}
                  </span>
                </div>
                <div
                  style={{
                    width: "18%",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "8px",
                    paddingLeft: "8px",
                    alignItems: "center",
                    fontWeight: "600",
                  }}
                >
                  <span>{subtotalSymbol}</span>
                  <span style={{ textAlign: "right", flex: 1 }}>
                    {subtotalAmount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "30px",
          }}
        >
          {/* Note */}
          {invoice.note ? (
            <div
              style={{
                flex: 1,
                marginRight: "20px",
                border: "1px solid #d1d5db",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "0px 12px 12px 12px",
                  fontSize: "9pt",
                  fontWeight: "700",
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                NOTES
              </div>
              <div
                style={{
                  padding: "12px",
                  fontSize: "9pt",
                  color: "#6b7280",
                  whiteSpace: "pre-wrap",
                }}
              >
                {invoice.note}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Totals */}
          <div
            style={{
              width: "310px",
              border: "1px solid #d1d5db",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0px 20px 12px 12px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "9pt",
              }}
            >
              <span style={{ fontWeight: "600" }}>Subtotal:</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  minWidth: "110px",
                }}
              >
                <span>{subtotalCurrency.symbol}</span>
                <span style={{ textAlign: "right", flex: 1 }}>
                  {subtotalCurrency.amount}
                </span>
              </span>
            </div>
            {taxEnabled && taxPercentage > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0px 20px 12px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "9pt",
                }}
              >
                <span style={{ fontWeight: "600" }}>
                  Tax ({taxPercentage}%):
                </span>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    minWidth: "110px",
                  }}
                >
                  <span>{taxCurrency.symbol}</span>
                  <span style={{ textAlign: "right", flex: 1 }}>
                    {taxCurrency.amount}
                  </span>
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0px 20px 12px 12px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "9pt",
              }}
            >
              <span style={{ fontWeight: "600" }}>Shipping:</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  minWidth: "110px",
                }}
              >
                <span>{shippingCurrency.symbol}</span>
                <span style={{ textAlign: "right", flex: 1 }}>
                  {shippingCurrency.amount}
                </span>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0px 20px 12px 12px",
                backgroundColor: brandColor,
                color: "#ffffff",
                fontSize: "12pt",
                fontWeight: "700",
              }}
            >
              <span>TOTAL:</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  minWidth: "110px",
                }}
              >
                <span>{totalCurrency.symbol}</span>
                <span style={{ textAlign: "right", flex: 1 }}>
                  {totalCurrency.amount}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        {storeSettings?.paymentMethod && (
          <div
            style={{
              border: "1px solid #d1d5db",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "0px 12px 12px 12px",
                fontSize: "9pt",
                fontWeight: "700",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              PAYMENT INFORMATION
            </div>
            <div
              style={{
                padding: "0px 12px 12px 12px",
                fontSize: "9pt",
              }}
            >
              {storeSettings.paymentMethod}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            paddingTop: "20px",
            borderTop: "2px solid #d1d5db",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            {storeSettings?.tagline && (
              <div
                style={{
                  fontSize: "9pt",
                  color: "#9ca3af",
                  fontStyle: "italic",
                }}
              >
                {storeSettings.tagline}
              </div>
            )}
          </div>

          {storeSettings?.adminName && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "9pt",
                  color: "#6b7280",
                  marginBottom: "20px",
                }}
              >
                Authorized Signature
              </div>
              {storeSettings?.signature && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storeSettings.signature}
                  alt="Signature"
                  style={{
                    maxWidth: "120px",
                    height: "auto",
                    maxHeight: "80px",
                    objectFit: "contain",
                    marginBottom: "10px",
                    marginLeft: "auto",
                    marginRight: "auto",
                    display: "block",
                  }}
                />
              )}
              <div
                style={{
                  borderTop: `2px solid ${brandColor}`,
                  paddingTop: "6px",
                  fontSize: "10pt",
                  fontWeight: "700",
                  color: brandColor,
                }}
              >
                {storeSettings.adminName}
              </div>
              {storeSettings?.adminTitle && (
                <div
                  style={{
                    fontSize: "9pt",
                    color: "#6b7280",
                  }}
                >
                  {storeSettings.adminTitle}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
