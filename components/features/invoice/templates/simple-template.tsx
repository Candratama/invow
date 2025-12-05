"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

/**
 * Simple Invoice Template
 *
 * Ultra-minimal invoice template with:
 * - Clean typography
 * - No borders or backgrounds
 * - Maximum whitespace
 * - Essential information only
 */
export function SimpleInvoiceTemplate({
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
          padding: "60px 60px 80px 60px",
          fontSize: "11pt",
          fontFamily: "Helvetica, Arial, sans-serif",
          backgroundColor: "#ffffff",
          color: "#000000",
          lineHeight: "1.6",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "12px",
              }
            : {}),
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "50px",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {storeSettings?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeSettings.logo}
                alt="Store Logo"
                style={{
                  height: "auto",
                  width: "auto",
                  maxWidth: "100px",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <div
                style={{
                  fontSize: "24pt",
                  fontWeight: "700",
                  marginBottom: "4px",
                  color: brandColor,
                }}
              >
                {storeSettings?.name || "Your Store"}
              </div>
              {storeSettings?.storeDescription && (
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#666666",
                    marginBottom: "0px",
                  }}
                >
                  ID: {storeSettings.storeNumber}
                </div>
              )}
              {storeSettings?.storeDescription && (
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#666666",
                    marginBottom: "4px",
                  }}
                >
                  {storeSettings.storeDescription}
                </div>
              )}

              <div style={{ fontSize: "9pt", color: "#666666" }}>
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
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "18pt",
                fontWeight: "700",
                marginBottom: "8px",
                paddingRight: "18px",
                paddingTop: "8px",
                color: brandColor,
              }}
            >
              INVOICE
            </div>
            <div
              style={{
                fontSize: "9pt",
                color: "#666666",
                paddingRight: "18px",
              }}
            >
              <div>{invoiceNumber}</div>
              <div>{formatDate(new Date(invoiceDate))}</div>
            </div>
          </div>
        </div>

        {/* Customer & Note */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginBottom: "50px",
          }}
        >
          {/* Customer */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "9pt",
                color: brandColor,
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              BILL TO
            </div>
            <div
              style={{
                fontSize: "12pt",
                fontWeight: "600",
                color: brandColor,
              }}
            >
              {customer.name}
            </div>
            {customer.address && (
              <div style={{ fontSize: "10pt", color: "#666666" }}>
                {customer.address}
              </div>
            )}
            {customer.status && (
              <div style={{ fontSize: "10pt", color: brandColor }}>
                {customer.status}
              </div>
            )}
          </div>

          {/* Note */}
          {invoice.note && (
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "9pt",
                  color: brandColor,
                  marginBottom: "6px",
                  fontWeight: "600",
                }}
              >
                NOTE
              </div>
              <div
                style={{
                  fontSize: "10pt",
                  color: "#666666",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                }}
              >
                {invoice.note}
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              paddingBottom: "14px",
              borderBottom: `2px solid ${brandColor}`,
              fontSize: "9pt",
              fontWeight: "600",
              marginBottom: "16px",
              color: brandColor,
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
                  paddingTop: "0px",
                  paddingBottom: "12px",
                  fontSize: "10pt",
                }}
              >
                <div
                  style={{
                    width: "10%",
                    textAlign: "center",

                    color: "#666666",
                  }}
                >
                  {index + 1}
                </div>
                <div
                  style={{ width: "40%", fontWeight: "500", textAlign: "left" }}
                >
                  {item.description}
                </div>
                <div
                  style={{
                    width: "10%",
                    textAlign: "center",
                    color: "#666666",
                  }}
                >
                  {item.quantity}
                </div>
                <div
                  style={{
                    width: "20%",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "18px",
                    paddingLeft: "18px",

                    color: "#666666",
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
                    paddingRight: "18px",
                    paddingLeft: "18px",
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

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "50px",

            // border: `2px solid ${brandColor}`,
          }}
        >
          <div style={{ width: "310px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "0px",
                paddingBottom: "8px",
                paddingRight: "18px",
                fontSize: "10pt",
              }}
            >
              <span>Subtotal</span>
              <span
                style={{
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
                  paddingTop: "0px",
                  paddingRight: "18px",
                  paddingBottom: "8px",
                  fontSize: "10pt",
                }}
              >
                <span>Tax ({taxPercentage}%)</span>
                <span
                  style={{
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
                paddingTop: "0px",
                paddingRight: "18px",
                paddingBottom: "16px",
                fontSize: "10pt",
                borderBottom: `2px solid ${brandColor}`,
              }}
            >
              <span>Shipping</span>
              <span
                style={{
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "8px",
                paddingRight: "18px",
                fontSize: "14pt",
                fontWeight: "700",
                color: brandColor,
              }}
            >
              <span>TOTAL</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  minWidth: "120px",
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
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "30px",
            borderTop: "1px solid #cccccc",
          }}
        >
          <div>
            {storeSettings?.paymentMethod && (
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "9pt",
                    color: brandColor,
                    marginBottom: "4px",
                    fontWeight: "600",
                  }}
                >
                  PAYMENT
                </div>
                <div style={{ fontSize: "10pt" }}>
                  {storeSettings.paymentMethod}
                </div>
              </div>
            )}
            {storeSettings?.tagline && (
              <div
                style={{
                  fontSize: "9pt",
                  color: "#999999",
                  fontStyle: "italic",
                }}
              >
                {storeSettings.tagline}
              </div>
            )}
          </div>

          {storeSettings?.adminName && (
            <div style={{ textAlign: "right" }}>
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
                    marginBottom: "8px",
                    marginLeft: "auto",
                    display: "block",
                  }}
                />
              )}
              <div
                style={{
                  borderTop: `2px solid ${brandColor}`,
                  paddingTop: "6px",
                  fontSize: "10pt",
                  fontWeight: "600",
                  color: brandColor,
                }}
              >
                {storeSettings.adminName}
              </div>
              {storeSettings?.adminTitle && (
                <div style={{ fontSize: "9pt", color: "#666666" }}>
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
