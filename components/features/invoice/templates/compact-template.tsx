"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

/**
 * Compact Invoice Template
 *
 * A space-efficient invoice template with:
 * - Dense information layout
 * - Smaller but readable fonts
 * - Grid-based design
 * - Efficient use of space
 * - Fits more items per page
 */
export function CompactInvoiceTemplate({
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
          padding: "40px 40px",
          fontSize: "9pt",
          fontFamily: "Arial, Helvetica, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          lineHeight: "1.2",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "12px",
              }
            : {}),
        }}
      >
        {/* Compact Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            marginBottom: "20px",
            borderBottom: `2px solid ${brandColor}`,
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {storeSettings?.logo && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storeSettings.logo}
                  alt="Logo"
                  style={{
                    height: "auto",
                    width: "auto",
                    maxWidth: "60px",
                    maxHeight: "60px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: "16pt",
                  fontWeight: "700",
                  color: brandColor,
                  lineHeight: "1.2",
                }}
              >
                {storeSettings?.name || "Your Store"}
              </div>
              <div
                style={{ fontSize: "8pt", color: "#6b7280", lineHeight: "1.2" }}
              >
                {storeSettings?.storeDescription}
                {storeSettings?.storeNumber && (
                  <div>ID: {storeSettings.storeNumber}</div>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "14pt",
                fontWeight: "700",
                color: brandColor,
                paddingRight: "16px",
              }}
            >
              INVOICE
            </div>
            <div
              style={{
                fontSize: "8pt",
                color: "#6b7280",
                paddingRight: "16px",
              }}
            >
              {invoiceNumber}
            </div>
            <div
              style={{
                fontSize: "8pt",
                color: "#6b7280",
                paddingRight: "16px",
              }}
            >
              {formatDate(new Date(invoiceDate))}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Customer Info */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f9fafb",
              padding: "0 12px 12px 12px",
              borderRadius: "0px",
            }}
          >
            <div
              style={{
                fontSize: "8pt",
                fontWeight: "700",
                color: brandColor,
                marginBottom: "6px",
              }}
            >
              BILL TO
            </div>
            <div
              style={{
                fontSize: "9pt",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {customer.name}
            </div>
            <div style={{ fontSize: "8pt", color: "#6b7280" }}>
              {customer.address && <div>{customer.address}</div>}
              {customer.status && <div>Status: {customer.status}</div>}
            </div>
          </div>

          {/* Store Info */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f9fafb",
              padding: "4px 12px 10px 12px",
              borderRadius: "0px",
            }}
          >
            <div
              style={{
                fontSize: "8pt",
                fontWeight: "700",
                color: brandColor,
                marginBottom: "6px",
              }}
            >
              FROM
            </div>
            <div style={{ fontSize: "8pt", color: "#6b7280" }}>
              {storeSettings?.address && (
                <div>{storeSettings.address.replace(/\n/g, ", ")}</div>
              )}
              {(storeSettings?.whatsapp || storeSettings?.email) && (
                <div>
                  {storeSettings?.whatsapp}
                  <br />
                  {storeSettings?.email}
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          {storeSettings?.paymentMethod && (
            <div
              style={{
                flex: 1,
                backgroundColor: "#f9fafb",
                padding: "4px 12px 10px 12px",
                borderRadius: "0px",
              }}
            >
              <div
                style={{
                  fontSize: "8pt",
                  fontWeight: "700",
                  color: brandColor,
                  marginBottom: "6px",
                }}
              >
                PAYMENT
              </div>
              <div style={{ fontSize: "8pt", color: "#6b7280" }}>
                {storeSettings.paymentMethod}
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: brandColor,
              color: "#ffffff",
              padding: "0px 10px 8px 10px",
              fontSize: "8pt",
              fontWeight: "700",
            }}
          >
            <div style={{ width: "10%", textAlign: "center" }}>NO</div>
            <div style={{ width: "40%", textAlign: "left" }}>ITEMS</div>
            <div style={{ width: "10%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "20%", textAlign: "center" }}>PRICE</div>
            <div style={{ width: "20%", textAlign: "center" }}>SUBTOTAL</div>
          </div>

          {items.map((item, index) => {
            const { symbol: priceSymbol, amount: priceAmount } = splitCurrency(
              item.price
            );
            const { symbol: subtotalSymbol, amount: subtotalAmount } =
              splitCurrency(item.subtotal);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  padding: "0px 10px 8px 10px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "9pt",
                  backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "10%",
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: "8pt",
                  }}
                >
                  {index + 1}
                </div>
                <div
                  style={{
                    width: "40%",
                    fontWeight: "600",
                    textAlign: "left",
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
                  {item.quantity}
                </div>
                <div
                  style={{
                    width: "20%",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "6px",
                    paddingLeft: "6px",
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
                    paddingRight: "6px",
                    paddingLeft: "6px",
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

        {/* Bottom Section */}
        <div
          style={{
            display: "flex",
            gap: "20px",
          }}
        >
          {/* Note */}
          {invoice.note ? (
            <div
              style={{
                flex: 1,
                backgroundColor: "#f9fafb",
                padding: "4px 12px 8px 12px",
                borderRadius: "0px",
                color: brandColor,
                borderLeft: `3px solid`,
                borderColor: brandColor,
              }}
            >
              <div
                style={{
                  fontSize: "8pt",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                NOTE
              </div>
              <div
                style={{
                  fontSize: "8pt",
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
          <div style={{ width: "340px" }}>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "4px 12px 8px 12px",
                borderRadius: "0px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  paddingRight: "4px",
                  fontSize: "9pt",
                }}
              >
                <span>Subtotal</span>
                <span
                  style={{
                    fontWeight: "600",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                    minWidth: "100px",
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
                    marginBottom: "6px",
                    paddingRight: "4px",
                    fontSize: "9pt",
                  }}
                >
                  <span>Tax ({taxPercentage}%)</span>
                  <span
                    style={{
                      fontWeight: "600",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "6px",
                      minWidth: "100px",
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
                  paddingBottom: "10px",
                  paddingRight: "4px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #d1d5db",
                  fontSize: "9pt",
                }}
              >
                <span>Shipping</span>
                <span
                  style={{
                    fontWeight: "600",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                    minWidth: "100px",
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
                  padding: "0px 10px 14px 10px",
                  backgroundColor: brandColor,
                  color: "#ffffff",
                  borderRadius: "0px",
                  fontSize: "11pt",
                  fontWeight: "700",
                }}
              >
                <span>TOTAL</span>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                    minWidth: "100px",
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
        </div>

        {/* Footer */}
        {storeSettings?.adminName && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              {storeSettings?.tagline && (
                <div
                  style={{
                    fontSize: "8pt",
                    color: "#9ca3af",
                    fontStyle: "italic",
                  }}
                >
                  {storeSettings.tagline}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {storeSettings?.signature && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storeSettings.signature}
                  alt="Signature"
                  style={{
                    maxWidth: "80px",
                    height: "auto",
                    maxHeight: "80px",
                    objectFit: "contain",
                    marginBottom: "6px",
                    marginLeft: "auto",
                    display: "block",
                  }}
                />
              )}
              <div
                style={{
                  borderTop: `2px solid ${brandColor}`,
                  paddingTop: "4px",
                  fontSize: "9pt",
                  fontWeight: "700",
                  color: brandColor,
                }}
              >
                {storeSettings.adminName}
              </div>
              {storeSettings?.adminTitle && (
                <div
                  style={{
                    fontSize: "8pt",
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
  );
}
