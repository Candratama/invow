"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService } from "@/lib/db/services";

/**
 * Elegant Invoice Template
 * 
 * A sophisticated invoice template with:
 * - Serif-inspired typography
 * - Thin elegant lines
 * - Generous whitespace
 * - Subtle luxury feel
 * - Premium aesthetic
 */
export function ElegantInvoiceTemplate({
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

  const brandColor = storeSettings?.brandColor || "#8b7355";

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
          padding: "70px 60px",
          fontSize: "11pt",
          fontFamily: "Georgia, 'Times New Roman', serif",
          backgroundColor: "#ffffff",
          color: "#2d2d2d",
          lineHeight: "1.7",
          ...(preview
            ? {
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08)",
                borderRadius: "12px",
              }
            : {}),
        }}
      >
        {/* Decorative Top Line */}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(to right, transparent, ${brandColor}, transparent)`,
            marginBottom: "50px",
          }}
        />

        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          {storeSettings?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storeSettings.logo}
              alt="Store Logo"
              style={{
                height: "70px",
                width: "auto",
                maxWidth: "100px",
                objectFit: "contain",
                marginBottom: "20px",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
          )}
          <div
            style={{
              fontSize: "32pt",
              fontWeight: "400",
              color: brandColor,
              marginBottom: "8px",
              letterSpacing: "2px",
            }}
          >
            {storeSettings?.name || "Your Store"}
          </div>
          {storeSettings?.storeDescription && (
            <div
              style={{
                fontSize: "11pt",
                color: "#666666",
                fontStyle: "italic",
                marginBottom: "16px",
              }}
            >
              {storeSettings.storeDescription}
            </div>
          )}
          <div
            style={{
              fontSize: "9pt",
              color: "#888888",
              lineHeight: "1.8",
            }}
          >
            {storeSettings?.address && (
              <div>{storeSettings.address.replace(/\n/g, " • ")}</div>
            )}
            <div>
              {storeSettings?.whatsapp && <span>{storeSettings.whatsapp}</span>}
              {storeSettings?.whatsapp && storeSettings?.email && (
                <span> • </span>
              )}
              {storeSettings?.email && <span>{storeSettings.email}</span>}
            </div>
          </div>
        </div>

        {/* Invoice Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "14pt",
              fontWeight: "400",
              color: brandColor,
              letterSpacing: "3px",
              marginBottom: "12px",
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              fontSize: "9pt",
              color: "#666666",
            }}
          >
            {invoiceNumber} • {formatDate(new Date(invoiceDate))}
          </div>
        </div>

        {/* Customer */}
        <div
          style={{
            marginBottom: "50px",
            paddingBottom: "30px",
            borderBottom: `1px solid ${brandColor}33`,
          }}
        >
          <div
            style={{
              fontSize: "9pt",
              color: brandColor,
              letterSpacing: "2px",
              marginBottom: "12px",
            }}
          >
            BILLED TO
          </div>
          <div
            style={{
              fontSize: "13pt",
              fontWeight: "600",
              color: "#2d2d2d",
              marginBottom: "6px",
            }}
          >
            {customer.name}
          </div>
          <div
            style={{
              fontSize: "10pt",
              color: "#666666",
              lineHeight: "1.6",
            }}
          >
            {customer.address && <div>{customer.address}</div>}
            {customer.status && (
              <div style={{ marginTop: "8px", fontStyle: "italic" }}>
                {customer.status}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              paddingBottom: "12px",
              borderBottom: `1px solid ${brandColor}`,
              fontSize: "9pt",
              fontWeight: "600",
              color: brandColor,
              letterSpacing: "1px",
              marginBottom: "20px",
            }}
          >
            <div style={{ width: "50%" }}>DESCRIPTION</div>
            <div style={{ width: "15%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "17.5%", textAlign: "right" }}>PRICE</div>
            <div style={{ width: "17.5%", textAlign: "right" }}>AMOUNT</div>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                paddingTop: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "10pt",
              }}
            >
              <div
                style={{
                  width: "50%",
                  fontWeight: "500",
                  color: "#2d2d2d",
                }}
              >
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
              <div
                style={{
                  width: "17.5%",
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#2d2d2d",
                }}
              >
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
          <div style={{ width: "320px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "10px",
                paddingBottom: "10px",
                fontSize: "10pt",
                color: "#666666",
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
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  fontSize: "10pt",
                  color: "#666666",
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
                paddingTop: "10px",
                paddingBottom: "20px",
                fontSize: "10pt",
                color: "#666666",
                borderBottom: `1px solid ${brandColor}`,
              }}
            >
              <span>Shipping</span>
              <span>{formatCurrency(calculation.shippingCost)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "20px",
                fontSize: "16pt",
                fontWeight: "400",
                color: brandColor,
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(calculation.total)}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        {invoice.note && (
          <div
            style={{
              marginBottom: "50px",
              padding: "20px",
              backgroundColor: "#fafafa",
              borderLeft: `2px solid ${brandColor}`,
            }}
          >
            <div
              style={{
                fontSize: "9pt",
                color: brandColor,
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              NOTE
            </div>
            <div
              style={{
                fontSize: "10pt",
                color: "#666666",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                fontStyle: "italic",
              }}
            >
              {invoice.note}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            paddingTop: "40px",
            borderTop: `1px solid ${brandColor}33`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            {storeSettings?.paymentMethod && (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "9pt",
                    color: brandColor,
                    letterSpacing: "2px",
                    marginBottom: "6px",
                  }}
                >
                  PAYMENT
                </div>
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#666666",
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
                  color: "#999999",
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
                  borderTop: `1px solid ${brandColor}`,
                  paddingTop: "8px",
                  fontSize: "10pt",
                  color: brandColor,
                  fontWeight: "500",
                }}
              >
                {storeSettings.adminName}
              </div>
              {storeSettings?.adminTitle && (
                <div
                  style={{
                    fontSize: "9pt",
                    color: "#888888",
                    fontStyle: "italic",
                  }}
                >
                  {storeSettings.adminTitle}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Decorative Bottom Line */}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(to right, transparent, ${brandColor}, transparent)`,
            marginTop: "50px",
          }}
        />
      </div>
    </div>
  );
}
