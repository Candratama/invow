"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

/**
 * Creative Invoice Template
 *
 * A unique and artistic invoice template with:
 * - Asymmetric layout
 * - Playful use of brand color
 * - Unique positioning
 * - Modern artistic feel
 * - Creative design elements
 */
export function CreativeInvoiceTemplate({
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

  // Free users always use default gold color, premium users can customize
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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 139, g: 92, b: 246 };
  };

  const rgb = hexToRgb(brandColor);
  const lightBrandColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
  const mediumBrandColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;

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
          fontFamily: "Arial, Helvetica, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          position: "relative",
          overflow: "hidden",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "12px",
              }
            : {}),
        }}
      >
        {/* Decorative Circle */}
        <div
          style={{
            position: "absolute",
            overflow: "hidden",
            top: "0px",
            right: "0px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            backgroundColor: lightBrandColor,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, padding: "50px 50px" }}>
          {/* Creative Header */}
          <div style={{ marginBottom: "40px" }}>
            <div
              style={{
                display: "block",
                backgroundColor: brandColor,
                color: "#ffffff",
                padding: "0px 30px 30px 30px",
                borderRadius: "0 30px 30px 0",
                marginLeft: "-50px",
                marginBottom: "20px",
                width: "fit-content",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  fontSize: "28pt",
                  fontWeight: "700",
                  letterSpacing: "2px",
                  color: "#ffffff",
                  lineHeight: "1",
                }}
              >
                INVOICE
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{ display: "flex", gap: "16px", alignItems: "center" }}
              >
                {storeSettings?.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storeSettings.logo}
                    alt="Logo"
                    style={{
                      height: "80px",
                      width: "auto",
                      maxWidth: "100px",
                      objectFit: "contain",
                      border: `3px solid ${brandColor}`,
                      borderRadius: "50%",
                      padding: "8px",
                    }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontSize: "20pt",
                      fontWeight: "700",
                      color: brandColor,
                      lineHeight: "1.2",
                    }}
                  >
                    {storeSettings?.name || "Your Store"}
                  </div>

                  {storeSettings?.storeDescription && (
                    <div style={{ fontSize: "10pt", color: "#6b7280" }}>
                      {storeSettings.storeDescription}
                    </div>
                  )}
                  {storeSettings?.storeNumber && (
                    <div style={{}}>ID: {storeSettings.storeNumber}</div>
                  )}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: brandColor,
                  padding: "16px 20px",
                  borderRadius: "12px",
                  textAlign: "right",
                  lineHeight: "1.2",
                }}
              >
                <div
                  style={{
                    fontSize: "9pt",
                    color: "#ffffff",
                    fontWeight: "700",
                    marginBottom: "6px",
                    letterSpacing: "1px",
                  }}
                >
                  INVOICE NO.
                </div>
                <div
                  style={{
                    fontSize: "11pt",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "#ffffff",
                  }}
                >
                  {invoiceNumber}
                </div>
                <div
                  style={{ fontSize: "9pt", color: "rgba(255, 255, 255, 0.9)" }}
                >
                  {formatDate(new Date(invoiceDate))}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Store Info */}
          <div
            style={{
              display: "flex",
              gap: "30px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                flex: 1,
                padding: "8px 20px 20px 20px",
                backgroundColor: lightBrandColor,
                borderRadius: "20px 0 20px 0",
              }}
            >
              <div
                style={{
                  fontSize: "9pt",
                  fontWeight: "700",
                  color: brandColor,
                  marginBottom: "10px",
                }}
              >
                BILL TO
              </div>
              <div
                style={{
                  fontSize: "13pt",
                  fontWeight: "700",
                  marginBottom: "6px",
                }}
              >
                {customer.name}
              </div>
              {customer.address && (
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  {customer.address}
                </div>
              )}
              {customer.status && (
                <div
                  style={{
                    marginTop: "8px",
                    display: "inline-block",
                    padding: "0px 12px 16px 12px",
                    backgroundColor: mediumBrandColor,
                    color: brandColor,
                    borderRadius: "12px",
                    fontSize: "9pt",
                    fontWeight: "600",
                  }}
                >
                  {customer.status}
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                padding: "8px 20px 20px 20px",
                border: `2px solid ${brandColor}`,
                borderRadius: "0 20px 0 20px",
              }}
            >
              <div
                style={{
                  fontSize: "9pt",
                  fontWeight: "700",
                  color: brandColor,
                  marginBottom: "10px",
                }}
              >
                FROM
              </div>
              <div style={{ fontSize: "10pt", color: "#6b7280" }}>
                {storeSettings?.address && (
                  <div style={{ whiteSpace: "pre-wrap", marginBottom: "4px" }}>
                    {storeSettings.address}
                  </div>
                )}
                {storeSettings?.whatsapp && <div>{storeSettings.whatsapp}</div>}
                {storeSettings?.email && <div>{storeSettings.email}</div>}
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: brandColor,
                fillOpacity: 0.5,
                color: "#ffffff",
                padding: "4px 12px 16px 12px",
                borderRadius: "12px 12px 0 0",
                fontSize: "9pt",
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
              const { symbol: priceSymbol, amount: priceAmount } =
                splitCurrency(item.price);
              const { symbol: subtotalSymbol, amount: subtotalAmount } =
                splitCurrency(item.subtotal);
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    padding: "0px 12px 16px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "10pt",
                    backgroundColor:
                      index % 2 === 1 ? lightBrandColor : "#ffffff",
                  }}
                >
                  <div
                    style={{
                      width: "10%",
                      textAlign: "center",
                      color: brandColor,
                      fontWeight: "700",
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
            {invoice.note ? (
              <div
                style={{
                  flex: 1,
                  padding: "8px 20px 20px 20px",
                  backgroundColor: lightBrandColor,
                  borderRadius: "0 20px 0 20px",
                  borderLeft: `4px solid`,
                  borderColor: brandColor,
                }}
              >
                <div
                  style={{
                    fontSize: "9pt",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }}
                >
                  NOTE
                </div>
                <div
                  style={{
                    fontSize: "10pt",
                    color: brandColor,
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

            <div style={{ width: "330px" }}>
              <div
                style={{
                  padding: "8px 20px 20px 20px",
                  backgroundColor: lightBrandColor,
                  borderRadius: "20px 0 20px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "10pt",
                  }}
                >
                  <span>Subtotal</span>
                  <span
                    style={{
                      fontWeight: "600",
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
                      marginBottom: "8px",
                      fontSize: "10pt",
                    }}
                  >
                    <span>Tax ({taxPercentage}%)</span>
                    <span
                      style={{
                        fontWeight: "600",
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
                    paddingBottom: "12px",
                    marginBottom: "12px",
                    borderBottom: `2px solid ${brandColor}`,
                    fontSize: "10pt",
                  }}
                >
                  <span>Shipping</span>
                  <span
                    style={{
                      fontWeight: "600",
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
                    padding: "0px 12px 16px 12px",
                    backgroundColor: brandColor,
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "14pt",
                    fontWeight: "700",
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
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: "30px",
              borderTop: `2px solid ${brandColor}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              {storeSettings?.paymentMethod && (
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "9pt",
                      fontWeight: "700",
                      color: brandColor,
                      marginBottom: "6px",
                    }}
                  >
                    PAYMENT METHOD
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
                      marginBottom: "12px",
                      marginLeft: "auto",
                      marginRight: "auto",
                      display: "block",
                    }}
                  />
                )}
                <div
                  style={{
                    padding: "0px 12px 16px 12px",
                    backgroundColor: lightBrandColor,
                    borderRadius: "20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11pt",
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
