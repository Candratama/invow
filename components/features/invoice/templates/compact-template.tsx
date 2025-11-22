"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

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

  const calculation = calculateTotal(
    subtotal,
    shippingCost,
    taxEnabled,
    taxPercentage
  );

  const brandColor = storeSettings?.brandColor || "#059669";

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
          lineHeight: "1.4",
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeSettings.logo}
                alt="Logo"
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
                  fontSize: "16pt",
                  fontWeight: "700",
                  color: brandColor,
                }}
              >
                {storeSettings?.name || "Your Store"}
              </div>
              <div style={{ fontSize: "8pt", color: "#6b7280" }}>
                {storeSettings?.storeDescription}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "14pt",
                fontWeight: "700",
                color: brandColor,
              }}
            >
              INVOICE
            </div>
            <div style={{ fontSize: "8pt", color: "#6b7280" }}>
              {invoiceNumber}
            </div>
            <div style={{ fontSize: "8pt", color: "#6b7280" }}>
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
          {/* Store Info */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f9fafb",
              padding: "12px",
              borderRadius: "6px",
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
              <div>
                {storeSettings?.whatsapp} • {storeSettings?.email}
              </div>
              {storeSettings?.storeNumber && (
                <div>ID: {storeSettings.storeNumber}</div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f9fafb",
              padding: "12px",
              borderRadius: "6px",
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
              {customer.address}
              {customer.status && <div>Status: {customer.status}</div>}
            </div>
          </div>

          {/* Payment Info */}
          {storeSettings?.paymentMethod && (
            <div
              style={{
                flex: 1,
                backgroundColor: "#f9fafb",
                padding: "12px",
                borderRadius: "6px",
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
              padding: "8px 10px",
              fontSize: "8pt",
              fontWeight: "700",
            }}
          >
            <div style={{ width: "6%", textAlign: "center" }}>#</div>
            <div style={{ width: "46%", textAlign: "left" }}>ITEM</div>
            <div style={{ width: "12%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "18%", textAlign: "right" }}>PRICE</div>
            <div style={{ width: "18%", textAlign: "right" }}>TOTAL</div>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                padding: "8px 10px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "9pt",
                backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
              }}
            >
              <div
                style={{
                  width: "6%",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "8pt",
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  width: "46%",
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
                backgroundColor: "#fef3c7",
                padding: "12px",
                borderRadius: "6px",
                borderLeft: `3px solid #f59e0b`,
              }}
            >
              <div
                style={{
                  fontSize: "8pt",
                  fontWeight: "700",
                  color: "#92400e",
                  marginBottom: "4px",
                }}
              >
                NOTE
              </div>
              <div
                style={{
                  fontSize: "8pt",
                  color: "#78350f",
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
          <div style={{ width: "240px" }}>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "12px",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "8pt",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: "600" }}>
                  {formatCurrency(calculation.subtotal)}
                </span>
              </div>
              {taxEnabled && taxPercentage > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "8pt",
                  }}
                >
                  <span>Tax ({taxPercentage}%)</span>
                  <span style={{ fontWeight: "600" }}>
                    {formatCurrency(calculation.taxAmount)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #d1d5db",
                  fontSize: "8pt",
                }}
              >
                <span>Shipping</span>
                <span style={{ fontWeight: "600" }}>
                  {formatCurrency(calculation.shippingCost)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px",
                  backgroundColor: brandColor,
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontSize: "11pt",
                  fontWeight: "700",
                }}
              >
                <span>TOTAL</span>
                <span>{formatCurrency(calculation.total)}</span>
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
