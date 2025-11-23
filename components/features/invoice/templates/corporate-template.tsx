"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

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
}: InvoiceTemplateProps) {
  const {
    customer,
    items,
    subtotal,
    shippingCost,
    invoiceNumber,
    invoiceDate,
  } = invoice;

  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [defaultBrandColor, setDefaultBrandColor] = useState("#D4A72C");

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

  const calculation = calculateTotal(
    subtotal,
    shippingCost,
    taxEnabled,
    taxPercentage
  );

  const brandColor = storeSettings?.brandColor || defaultBrandColor;

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
          lineHeight: "1.5",
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
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {storeSettings?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storeSettings.logo}
                  alt="Company Logo"
                  style={{
                    height: "100%",
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
                    marginBottom: "4px",
                  }}
                >
                  {storeSettings?.name || "Your Company Name"}
                </div>
                {storeSettings?.storeDescription && (
                  <div style={{ fontSize: "9pt", color: "#6b7280" }}>
                    {storeSettings.storeDescription}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{ textAlign: "right", fontSize: "9pt", color: "#6b7280" }}
            >
              {storeSettings?.address && (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {storeSettings.address}
                </div>
              )}
              {storeSettings?.whatsapp && <div>{storeSettings.whatsapp}</div>}
              {storeSettings?.email && <div>{storeSettings.email}</div>}
              {storeSettings?.storeNumber && (
                <div>Reg. No: {storeSettings.storeNumber}</div>
              )}
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
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
            Invoice Number: {invoiceNumber}
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
                padding: "10px 12px",
                fontSize: "9pt",
                fontWeight: "700",
              }}
            >
              INVOICE DETAILS
            </div>
            <div style={{ padding: "12px", fontSize: "9pt" }}>
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
                <span>{invoiceNumber}</span>
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
                padding: "10px 12px",
                fontSize: "9pt",
                fontWeight: "700",
              }}
            >
              BILL TO
            </div>
            <div style={{ padding: "12px", fontSize: "9pt" }}>
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
              padding: "10px 12px",
              fontSize: "9pt",
              fontWeight: "700",
            }}
          >
            <div style={{ width: "8%", textAlign: "center" }}>NO.</div>
            <div style={{ width: "44%", textAlign: "left" }}>DESCRIPTION</div>
            <div style={{ width: "12%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "18%", textAlign: "right" }}>UNIT PRICE</div>
            <div style={{ width: "18%", textAlign: "right" }}>AMOUNT</div>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                padding: "10px 12px",
                borderBottom:
                  index < items.length - 1 ? "1px solid #e5e7eb" : "none",
                fontSize: "9pt",
                backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
              }}
            >
              <div
                style={{
                  width: "8%",
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
                }}
              >
                {item.description}
              </div>
              <div
                style={{
                  width: "12%",
                  textAlign: "center",
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
                }}
              >
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))}
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
                marginRight: "30px",
                border: "1px solid #d1d5db",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "10px 12px",
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
              width: "280px",
              border: "1px solid #d1d5db",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "9pt",
              }}
            >
              <span style={{ fontWeight: "600" }}>Subtotal:</span>
              <span>{formatCurrency(calculation.subtotal)}</span>
            </div>
            {taxEnabled && taxPercentage > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "9pt",
                }}
              >
                <span style={{ fontWeight: "600" }}>
                  Tax ({taxPercentage}%):
                </span>
                <span>{formatCurrency(calculation.taxAmount)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "9pt",
              }}
            >
              <span style={{ fontWeight: "600" }}>Shipping:</span>
              <span>{formatCurrency(calculation.shippingCost)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px",
                backgroundColor: brandColor,
                color: "#ffffff",
                fontSize: "12pt",
                fontWeight: "700",
              }}
            >
              <span>TOTAL:</span>
              <span>{formatCurrency(calculation.total)}</span>
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
                padding: "10px 12px",
                fontSize: "9pt",
                fontWeight: "700",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              PAYMENT INFORMATION
            </div>
            <div
              style={{
                padding: "12px",
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
