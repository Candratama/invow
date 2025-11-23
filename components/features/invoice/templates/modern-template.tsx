"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

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
}: InvoiceTemplateProps) {
  const {
    customer,
    items,
    subtotal,
    shippingCost,
    invoiceNumber,
    invoiceDate,
  } = invoice;

  // Tax preferences state
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [defaultBrandColor, setDefaultBrandColor] = useState("#D4A72C");

  // Fetch tax preferences on mount
  useEffect(() => {
    const fetchTaxPreferences = async () => {
      try {
        const { data } = await userPreferencesService.getUserPreferences();
        setTaxEnabled(data.tax_enabled);
        setTaxPercentage(data.tax_percentage ?? 0);
      } catch (error) {
        console.error("Failed to fetch tax preferences:", error);
      }
    };

    fetchTaxPreferences();
  }, []);

  useEffect(() => {
    // Get primary color from CSS variable
    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();

    if (primaryColor) {
      const [h, s, l] = primaryColor.split(" ").map((v) => parseFloat(v));
      setDefaultBrandColor(hslToHex(h, s, l));
    }
  }, []);

  // Calculate totals with tax
  const calculation = calculateTotal(
    subtotal,
    shippingCost,
    taxEnabled,
    taxPercentage
  );

  const brandColor = storeSettings?.brandColor || defaultBrandColor;

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
              alignItems: "flex-start",
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
                    width: "auto",
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
                    marginBottom: "8px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {storeSettings?.name || "Your Store"}
                </div>
                {storeSettings?.storeDescription && (
                  <div
                    style={{
                      fontSize: "11pt",
                      opacity: 0.9,
                      marginBottom: "12px",
                    }}
                  >
                    {storeSettings.storeDescription}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "9pt",
                    opacity: 0.85,
                    lineHeight: "1.6",
                  }}
                >
                  {storeSettings?.address && (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {storeSettings.address}
                    </div>
                  )}
                  {storeSettings?.whatsapp && (
                    <div>{storeSettings.whatsapp}</div>
                  )}
                  {storeSettings?.email && <div>{storeSettings.email}</div>}
                </div>
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                padding: "20px 24px",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  fontSize: "11pt",
                  fontWeight: "600",
                  marginBottom: "12px",
                  opacity: 0.9,
                }}
              >
                INVOICE
              </div>
              <div
                style={{
                  fontSize: "10pt",
                  lineHeight: "1.8",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <span style={{ opacity: 0.8 }}>No:</span>{" "}
                  <span style={{ fontWeight: "600" }}>{invoiceNumber}</span>
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
          {/* Customer Card */}
          <div
            style={{
              backgroundColor: lightBrandColor,
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "40px",
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
                    marginTop: "8px",
                    display: "inline-block",
                    padding: "4px 12px",
                    backgroundColor: brandColor,
                    color: "#ffffff",
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

          {/* Items Table */}
          <div style={{ marginBottom: "40px" }}>
            {/* Table Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: mediumBrandColor,
                padding: "14px 20px",
                borderRadius: "8px",
                fontSize: "9pt",
                fontWeight: "700",
                color: brandColor,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "4px",
              }}
            >
              <div style={{ width: "8%", textAlign: "center" }}>#</div>
              <div style={{ width: "44%", textAlign: "left" }}>Description</div>
              <div style={{ width: "12%", textAlign: "center" }}>Qty</div>
              <div style={{ width: "18%", textAlign: "right" }}>Price</div>
              <div style={{ width: "18%", textAlign: "right" }}>Amount</div>
            </div>

            {/* Table Rows */}
            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "10pt",
                  backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "8%",
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
                    width: "12%",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  {item.quantity}
                </div>
                <div
                  style={{
                    width: "18%",
                    textAlign: "right",
                    color: "#6b7280",
                  }}
                >
                  {formatCurrency(item.price)}
                </div>
                <div
                  style={{
                    width: "18%",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
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
                  padding: "20px",
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
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "10px",
                    marginBottom: "10px",
                    fontSize: "10pt",
                    color: "#6b7280",
                  }}
                >
                  <span>Subtotal</span>
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    {formatCurrency(calculation.subtotal)}
                  </span>
                </div>
                {taxEnabled && taxPercentage > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      marginBottom: "10px",
                      fontSize: "10pt",
                      color: "#6b7280",
                    }}
                  >
                    <span>Tax ({taxPercentage}%)</span>
                    <span style={{ fontWeight: "600", color: "#1f2937" }}>
                      {formatCurrency(calculation.taxAmount)}
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
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>
                    {formatCurrency(calculation.shippingCost)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                  padding: "20px",
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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
                  }}
                >
                  {formatCurrency(calculation.total)}
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
                    padding: "12px 20px",
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
