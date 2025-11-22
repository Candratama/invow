"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

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

  // Calculate totals with tax
  const calculation = calculateTotal(
    subtotal,
    shippingCost,
    taxEnabled,
    taxPercentage
  );
  
  const brandColor = storeSettings?.brandColor || "#000000";

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
                  height: "100%",
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
              <div style={{ fontSize: "9pt", color: "#666666" }}>
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
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "18pt",
                fontWeight: "700",
                marginBottom: "8px",
                color: brandColor,
              }}
            >
              INVOICE
            </div>
            <div style={{ fontSize: "9pt", color: "#666666" }}>
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
                marginBottom: "6px",
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
              paddingBottom: "8px",
              borderBottom: `2px solid ${brandColor}`,
              fontSize: "9pt",
              fontWeight: "600",
              marginBottom: "16px",
              color: brandColor,
            }}
          >
            <div style={{ width: "50%" }}>ITEM</div>
            <div style={{ width: "15%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "17.5%", textAlign: "right" }}>PRICE</div>
            <div style={{ width: "17.5%", textAlign: "right" }}>AMOUNT</div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                paddingTop: "12px",
                paddingBottom: "12px",
                fontSize: "10pt",
              }}
            >
              <div style={{ width: "50%", fontWeight: "500" }}>
                {item.description}
              </div>
              <div
                style={{
                  width: "15%",
                  textAlign: "center",
                  color: "#666666",
                }}
              >
                {item.quantity}
              </div>
              <div
                style={{
                  width: "17.5%",
                  textAlign: "right",
                  color: "#666666",
                }}
              >
                {formatCurrency(item.price)}
              </div>
              <div style={{ width: "17.5%", textAlign: "right" }}>
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "50px",
          }}
        >
          <div style={{ width: "300px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "8px",
                paddingBottom: "8px",
                fontSize: "10pt",
              }}
            >
              <span>Subtotal</span>
              <span>{formatCurrency(calculation.subtotal)}</span>
            </div>
            {taxEnabled && taxPercentage > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  fontSize: "10pt",
                }}
              >
                <span>Tax ({taxPercentage}%)</span>
                <span>{formatCurrency(calculation.taxAmount)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "8px",
                paddingBottom: "16px",
                fontSize: "10pt",
                borderBottom: `2px solid ${brandColor}`,
              }}
            >
              <span>Shipping</span>
              <span>{formatCurrency(calculation.shippingCost)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "16px",
                fontSize: "14pt",
                fontWeight: "700",
                color: brandColor,
              }}
            >
              <span>TOTAL</span>
              <span>{formatCurrency(calculation.total)}</span>
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
