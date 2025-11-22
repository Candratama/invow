"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

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

  const brandColor = storeSettings?.brandColor || "#8b5cf6";

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
            top: "-100px",
            right: "-100px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            backgroundColor: lightBrandColor,
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, padding: "50px 50px" }}>
          {/* Creative Header */}
          <div style={{ marginBottom: "40px" }}>
            <div
              style={{
                display: "inline-block",
                backgroundColor: brandColor,
                color: "#ffffff",
                padding: "20px 30px",
                borderRadius: "0 30px 30px 0",
                marginLeft: "-50px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "28pt",
                  fontWeight: "700",
                  letterSpacing: "1px",
                }}
              >
                INVOICE
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
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
                      marginBottom: "4px",
                    }}
                  >
                    {storeSettings?.name || "Your Store"}
                  </div>
                  {storeSettings?.storeDescription && (
                    <div style={{ fontSize: "10pt", color: "#6b7280" }}>
                      {storeSettings.storeDescription}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: lightBrandColor,
                  padding: "16px 20px",
                  borderRadius: "12px",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: "9pt",
                    color: brandColor,
                    fontWeight: "700",
                    marginBottom: "6px",
                  }}
                >
                  INVOICE NO.
                </div>
                <div
                  style={{
                    fontSize: "11pt",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }}
                >
                  {invoiceNumber}
                </div>
                <div style={{ fontSize: "9pt", color: "#6b7280" }}>
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
                padding: "20px",
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
              <div style={{ fontSize: "10pt", color: "#6b7280" }}>
                {customer.address}
                
              </div>
              <div style={{ fontSize: "10pt", color: "#6b7280" }}>

                {customer.status && (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "inline-block",
                      padding: "4px 12px",
                      backgroundColor: brandColor,
                      color: "#ffffff",
                      borderRadius: "12px",
                      fontSize: "9pt",
                      fontWeight: "600",
                    }}
                  >
                    {customer.status}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                padding: "20px",
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
                  <div style={{ whiteSpace: "pre-wrap" }}>
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
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "12px 12px 0 0",
                fontSize: "9pt",
                fontWeight: "700",
              }}
            >
              <div style={{ width: "8%", textAlign: "center" }}>#</div>
              <div style={{ width: "44%", textAlign: "left" }}>DESCRIPTION</div>
              <div style={{ width: "12%", textAlign: "center" }}>QTY</div>
              <div style={{ width: "18%", textAlign: "right" }}>PRICE</div>
              <div style={{ width: "18%", textAlign: "right" }}>AMOUNT</div>
            </div>

            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  padding: "14px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "10pt",
                  backgroundColor: index % 2 === 1 ? lightBrandColor : "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "8%",
                    textAlign: "center",
                    color: brandColor,
                    fontWeight: "700",
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
                  padding: "20px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "0 20px 0 20px",
                  borderLeft: `4px solid #f59e0b`,
                }}
              >
                <div
                  style={{
                    fontSize: "9pt",
                    fontWeight: "700",
                    color: "#92400e",
                    marginBottom: "8px",
                  }}
                >
                  NOTE
                </div>
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#78350f",
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

            <div style={{ width: "300px" }}>
              <div
                style={{
                  padding: "20px",
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
                  <span style={{ fontWeight: "600" }}>
                    {formatCurrency(calculation.subtotal)}
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
                    <span style={{ fontWeight: "600" }}>
                      {formatCurrency(calculation.taxAmount)}
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
                  <span style={{ fontWeight: "600" }}>
                    {formatCurrency(calculation.shippingCost)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "16px",
                    backgroundColor: brandColor,
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "14pt",
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
                    padding: "10px 20px",
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
