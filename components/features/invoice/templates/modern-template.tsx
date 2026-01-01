"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

/**
 * Modern Invoice Template
 *
 * A contemporary invoice template with:
 * - Bold geometric design
 * - Gradient accents
 * - Card-based layout
 * - Modern typography
 * - Clean spacing
 */
export function ModernInvoiceTemplate({
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

  // Calculate totals with tax
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

  // Helper to create lighter shade of brand color
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 99, g: 102, b: 241 };
  };

  const rgb = hexToRgb(brandColor);
  const lightBrandColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const mediumBrandColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

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
          fontSize: "11pt",
          fontFamily: "Helvetica, Arial, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "16px",
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {/* Header with Gradient */}
        <div
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
            padding: "40px 50px",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {storeSettings?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storeSettings.logo}
                  alt="Store Logo"
                  style={{
                    height: "100%",
                    width: "100%",
                    maxWidth: "100px",
                    objectFit: "contain",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "12px",
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: "28pt",
                    fontWeight: "700",
                    marginBottom: "-8px",
                    letterSpacing: "-0.5px",
                    alignItems: "end",
                  }}
                >
                  {storeSettings?.name || "Your Store"}
                </div>

                {storeSettings?.storeDescription && (
                  <div
                    style={{
                      fontSize: "11pt",
                      opacity: 0.9,
                    }}
                  >
                    {storeSettings.storeDescription}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "9pt",
                    opacity: 0.85,
                    lineHeight: "1.2",
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
                  {storeSettings?.storeNumber && (
                    <div>ID: {storeSettings.storeNumber}</div>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                // backgroundColor: "rgba(255, 255, 255, 0.15)",
                // padding: "20px 24px",
                // borderRadius: "12px",
                // backdropFilter: "blur(10px)",
                // border: `1px solid #fff`,
              }}
            >
              <div
                style={{
                  fontSize: "24pt",
                  fontWeight: "600",
                  paddingRight: "28px",
                  opacity: 0.9,
                }}
              >
                INVOICE
              </div>
              <div
                style={{
                  fontSize: "10pt",
                  lineHeight: "1.2",
                  paddingRight: "28px",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <span style={{ opacity: 0.8 }}>No:</span>{" "}
                  <span style={{ fontWeight: "600" }}>{displayNumber}</span>
                </div>
                <div>
                  <span style={{ opacity: 0.8 }}>Date:</span>{" "}
                  <span style={{ fontWeight: "600" }}>
                    {formatDate(new Date(invoiceDate))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "40px 50px 50px 50px" }}>
          {/* Customer & Store Address Cards */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            {/* Bill To Card */}
            <div
              style={{
                flex: 1,
                backgroundColor: lightBrandColor,
                padding: "14px 24px 24px 24px",
                borderRadius: "12px",
                borderLeft: `4px solid ${brandColor}`,
              }}
            >
              <div
                style={{
                  fontSize: "9pt",
                  fontWeight: "700",
                  color: brandColor,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}
              >
                Bill To
              </div>
              <div
                style={{
                  fontSize: "14pt",
                  fontWeight: "700",
                  color: "#1f2937",
                  marginBottom: "6px",
                }}
              >
                {customer.name}
              </div>
              <div
                style={{
                  fontSize: "10pt",
                  color: "#6b7280",
                  lineHeight: "1.6",
                }}
              >
                {customer.address && <div>{customer.address}</div>}
                {customer.status && (
                  <div
                    style={{
                      marginTop: "18px",
                      display: "inline-block",
                      padding: "0px 10px 14px 10px",
                      backgroundColor: mediumBrandColor,
                      color: brandColor,
                      borderRadius: "6px",
                      fontSize: "9pt",
                      fontWeight: "600",
                    }}
                  >
                    {customer.status}
                  </div>
                )}
              </div>
            </div>

            {/* Store Address Card */}
            <div
              style={{
                flex: 1,
                backgroundColor: lightBrandColor,
                padding: "14px 24px 24px 24px",
                borderRadius: "12px",
                borderLeft: `4px solid ${brandColor}`,
              }}
            >
              <div
                style={{
                  fontSize: "9pt",
                  fontWeight: "700",
                  color: brandColor,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}
              >
                From
              </div>

              <div
                style={{
                  fontSize: "10pt",
                  color: "#6b7280",
                  lineHeight: "1.6",
                }}
              >
                {storeSettings?.address && (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {storeSettings.address}
                  </div>
                )}
                {storeSettings?.whatsapp && (
                  <div style={{ marginTop: "8px" }}>
                    {storeSettings.whatsapp}
                  </div>
                )}
                {storeSettings?.email && <div>{storeSettings.email}</div>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: "40px" }}>
            {/* Table Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: mediumBrandColor,
                padding: "0px 20px 14px 20px",
                borderRadius: "8px",
                fontSize: "9pt",
                fontWeight: "700",
                color: brandColor,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "4px",
              }}
            >
              <div style={{ width: "10%", textAlign: "center" }}>NO</div>
              <div style={{ width: "44%", textAlign: "left" }}>ITEMS</div>
              <div style={{ width: "10%", textAlign: "center" }}>QTY</div>
              <div style={{ width: "20%", textAlign: "center" }}>PRICE</div>
              <div style={{ width: "20%", textAlign: "center" }}>SUBTOTAL</div>
            </div>

            {/* Table Rows */}
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
                    alignItems: "center",
                    padding: "0px 20px 14px 20px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "10pt",
                    backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                  }}
                >
                  <div
                    style={{
                      width: "10%",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontWeight: "600",
                      fontSize: "9pt",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      width: "44%",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#1f2937",
                    }}
                  >
                    {item.description}
                  </div>
                  <div
                    style={{
                      width: "10%",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    {qtyDisplay}
                  </div>
                  <div
                    style={{
                      width: "20%",
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
                      width: "20%",
                      display: "flex",
                      justifyContent: "space-between",
                      paddingRight: "8px",
                      paddingLeft: "8px",
                      alignItems: "center",
                      fontWeight: "600",
                      color: "#1f2937",
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

          {/* Note & Totals */}
          <div
            style={{
              display: "flex",
              gap: "30px",
              marginBottom: "40px",
            }}
          >
            {/* Note */}
            {invoice.note ? (
              <div
                style={{
                  flex: 1,
                  backgroundColor: lightBrandColor,
                  padding: "10px 20px 20px 20px",
                  borderRadius: "12px",
                  borderLeft: `4px solid ${brandColor}`,
                }}
              >
                <div
                  style={{
                    fontSize: "9pt",
                    fontWeight: "700",
                    color: brandColor,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "8px",
                  }}
                >
                  Note
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
            ) : (
              <div style={{ flex: 1 }} />
            )}

            {/* Totals Card */}
            <div
              style={{
                width: "320px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "0 20px 18px 20px",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  paddingRight: "28px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "4px",
                    marginBottom: "4px",
                    fontSize: "10pt",
                    color: "#6b7280",
                  }}
                >
                  <span>Subtotal</span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#1f2937",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "120px",
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
                      paddingBottom: "4px",
                      marginBottom: "4px",
                      fontSize: "10pt",
                      color: "#6b7280",
                    }}
                  >
                    <span>Tax ({taxPercentage}%)</span>
                    <span
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        minWidth: "120px",
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
                    fontSize: "10pt",
                    color: "#6b7280",
                  }}
                >
                  <span>Shipping</span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#1f2937",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "120px",
                    }}
                  >
                    <span>{shippingCurrency.symbol}</span>
                    <span style={{ textAlign: "right", flex: 1 }}>
                      {shippingCurrency.amount}
                    </span>
                  </span>
                </div>
              </div>

              {/* Total */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                  padding: "0 28px 20px 20px",
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "end",
                }}
              >
                <span
                  style={{
                    fontSize: "12pt",
                    fontWeight: "700",
                    color: "#ffffff",
                  }}
                >
                  TOTAL
                </span>
                <span
                  style={{
                    fontSize: "18pt",
                    fontWeight: "700",
                    color: "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    minWidth: "140px",
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

          {/* Footer */}
          <div
            style={{
              paddingTop: "30px",
              borderTop: "2px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {/* Payment Info */}
            <div style={{ flex: 1 }}>
              {storeSettings?.paymentMethod && (
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "9pt",
                      fontWeight: "700",
                      color: brandColor,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "6px",
                    }}
                  >
                    Payment Method
                  </div>
                  <div
                    style={{
                      fontSize: "10pt",
                      color: "#1f2937",
                      fontWeight: "600",
                    }}
                  >
                    {storeSettings.paymentMethod}
                  </div>
                </div>
              )}
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

            {/* Signature */}
            {storeSettings?.adminName && (
              <div
                style={{
                  textAlign: "center",
                  minWidth: "200px",
                }}
              >
                <div
                  style={{
                    fontSize: "9pt",
                    color: "#9ca3af",
                    marginBottom: "30px",
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
                      maxWidth: "140px",
                      height: "auto",
                      maxHeight: "80px",
                      objectFit: "contain",
                      marginBottom: "12px",
                      marginLeft: "auto",
                      marginRight: "auto",
                      display: "block",
                    }}
                  />
                )}
                <div
                  style={{
                    backgroundColor: lightBrandColor,
                    padding: "0 12px 18px 12px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11pt",
                      fontWeight: "700",
                      color: brandColor,
                      marginBottom: "2px",
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
