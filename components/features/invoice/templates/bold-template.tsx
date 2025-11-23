"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

/**
 * Bold Invoice Template
 *
 * A strong and impactful invoice template with:
 * - Large bold typography
 * - Thick borders and dividers
 * - High contrast design
 * - Geometric shapes
 * - Strong visual hierarchy
 */
export function BoldInvoiceTemplate({
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

  const brandColor = storeSettings?.brandColor || "#10b981";

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
          color: "#000000",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "12px",
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {/* Bold Header Bar */}
        <div
          style={{
            backgroundColor: brandColor,
            padding: "30px 50px",
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
                    width: "auto",
                    maxWidth: "100px",
                    objectFit: "contain",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",

                    borderRadius: "8px",
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: "28pt",
                    fontWeight: "900",
                    marginBottom: "4px",
                  }}
                >
                  {storeSettings?.name || "YOUR STORE"}
                </div>
                {storeSettings?.storeDescription && (
                  <div style={{ fontSize: "11pt", opacity: 0.9 }}>
                    {storeSettings.storeDescription}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: "36pt",
                fontWeight: "900",
                letterSpacing: "2px",
              }}
            >
              INVOICE
            </div>
          </div>
        </div>

        <div style={{ padding: "40px 50px" }}>
          {/* Invoice Info & Customer */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginBottom: "40px",
            }}
          >
            {/* Invoice Info */}
            <div
              style={{
                flex: 1,
                border: `4px solid ${brandColor}`,
                padding: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "10pt",
                  fontWeight: "900",
                  color: brandColor,
                  marginBottom: "12px",
                }}
              >
                INVOICE DETAILS
              </div>
              <div style={{ fontSize: "10pt", lineHeight: "1.8" }}>
                <div>
                  <span style={{ fontWeight: "700" }}>Number:</span>{" "}
                  {invoiceNumber}
                </div>
                <div>
                  <span style={{ fontWeight: "700" }}>Date:</span>{" "}
                  {formatDate(new Date(invoiceDate))}
                </div>
                {storeSettings?.storeNumber && (
                  <div>
                    <span style={{ fontWeight: "700" }}>Store ID:</span>{" "}
                    {storeSettings.storeNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Customer */}
            <div
              style={{
                flex: 1,
                border: `4px solid #000000`,
                padding: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "10pt",
                  fontWeight: "900",
                  marginBottom: "12px",
                }}
              >
                BILL TO
              </div>
              <div
                style={{
                  fontSize: "12pt",
                  fontWeight: "700",
                  marginBottom: "6px",
                }}
              >
                {customer.name}
              </div>
              <div style={{ fontSize: "10pt", color: "#666666" }}>
                {customer.address && <div>{customer.address}</div>}
                {customer.status && (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "inline-block",
                      padding: "4px 12px",
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "9pt",
                    }}
                  >
                    {customer.status}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: "14px 16px",
                fontSize: "10pt",
                fontWeight: "900",
              }}
            >
              <div style={{ width: "8%", textAlign: "center" }}>#</div>
              <div style={{ width: "44%", textAlign: "left" }}>ITEM</div>
              <div style={{ width: "12%", textAlign: "center" }}>QTY</div>
              <div style={{ width: "18%", textAlign: "right" }}>PRICE</div>
              <div style={{ width: "18%", textAlign: "right" }}>TOTAL</div>
            </div>

            {items.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  padding: "14px 16px",
                  borderBottom: "2px solid #e5e7eb",
                  fontSize: "10pt",
                  backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "8%",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  {index + 1}
                </div>
                <div
                  style={{
                    width: "44%",
                    fontWeight: "700",
                  }}
                >
                  {item.description}
                </div>
                <div
                  style={{
                    width: "12%",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  {item.quantity}
                </div>
                <div
                  style={{
                    width: "18%",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(item.price)}
                </div>
                <div
                  style={{
                    width: "18%",
                    textAlign: "right",
                    fontWeight: "700",
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
                  border: `3px solid ${brandColor}`,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "10pt",
                    fontWeight: "900",
                    color: brandColor,
                    marginBottom: "8px",
                  }}
                >
                  IMPORTANT NOTE
                </div>
                <div
                  style={{
                    fontSize: "10pt",
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
                  border: "3px solid #000000",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "10px",
                    marginBottom: "10px",
                    fontSize: "10pt",
                    fontWeight: "700",
                  }}
                >
                  <span>SUBTOTAL</span>
                  <span>{formatCurrency(calculation.subtotal)}</span>
                </div>
                {taxEnabled && taxPercentage > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      marginBottom: "10px",
                      fontSize: "10pt",
                      fontWeight: "700",
                    }}
                  >
                    <span>TAX ({taxPercentage}%)</span>
                    <span>{formatCurrency(calculation.taxAmount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "16px",
                    marginBottom: "16px",
                    borderBottom: "2px solid #000000",
                    fontSize: "10pt",
                    fontWeight: "700",
                  }}
                >
                  <span>SHIPPING</span>
                  <span>{formatCurrency(calculation.shippingCost)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "16px",
                    backgroundColor: brandColor,
                    color: "#ffffff",
                    fontSize: "16pt",
                    fontWeight: "900",
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
              borderTop: "4px solid #000000",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              {storeSettings?.paymentMethod && (
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "10pt",
                      fontWeight: "900",
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
              <div style={{ fontSize: "9pt", color: "#666666" }}>
                {storeSettings?.address && (
                  <div>{storeSettings.address.replace(/\n/g, " • ")}</div>
                )}
                {(storeSettings?.whatsapp || storeSettings?.email) && (
                  <div>
                    {storeSettings?.whatsapp}
                    {storeSettings?.whatsapp && storeSettings?.email && " • "}
                    {storeSettings?.email}
                  </div>
                )}
                {storeSettings?.tagline && (
                  <div style={{ fontStyle: "italic", marginTop: "8px" }}>
                    {storeSettings.tagline}
                  </div>
                )}
              </div>
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
                      marginBottom: "12px",
                      marginLeft: "auto",
                      display: "block",
                    }}
                  />
                )}
                <div
                  style={{
                    borderTop: "3px solid #000000",
                    paddingTop: "8px",
                    fontSize: "11pt",
                    fontWeight: "900",
                  }}
                >
                  {storeSettings.adminName}
                </div>
                {storeSettings?.adminTitle && (
                  <div
                    style={{
                      fontSize: "9pt",
                      fontWeight: "700",
                      color: "#666666",
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
    </div>
  );
}
