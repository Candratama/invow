"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

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
          width: "800px",
          padding: "70px 60px",
          fontSize: "13pt",
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
                height: "100%",
                width: "auto",
                maxWidth: "120px",
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
              fontSize: "35pt",
              fontWeight: "400",
              color: brandColor,
              // marginBottom: "8px",
              letterSpacing: "2px",
            }}
          >
            {storeSettings?.name || "Your Store"}
          </div>

          {storeSettings?.storeDescription && (
            <div
              style={{
                fontSize: "14pt",
                color: "#666666",
                fontStyle: "italic",
                // marginBottom: "16px",
              }}
            >
              {storeSettings.storeDescription}
            </div>
          )}
          <div
            style={{
              fontSize: "12pt",
              color: "#888888",
              lineHeight: "1.4",
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

              {storeSettings?.storeNumber && (
                <div>ID: {storeSettings.storeNumber}</div>
              )}
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
              fontSize: "17pt",
              fontWeight: "400",
              color: brandColor,
              letterSpacing: "3px",
              // marginBottom: "12px",
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              fontSize: "12pt",
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
              fontSize: "12pt",
              color: brandColor,
              letterSpacing: "2px",
              marginBottom: "12px",
            }}
          >
            BILLED TO
          </div>
          <div
            style={{
              fontSize: "16pt",
              fontWeight: "600",
              color: "#2d2d2d",
              marginBottom: "6px",
            }}
          >
            {customer.name}
          </div>
          <div
            style={{
              fontSize: "13pt",
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
              padding: "0 12px 12px 12px",
              borderBottom: `1px solid ${brandColor}`,
              fontSize: "12pt",
              fontWeight: "600",
              color: brandColor,
              letterSpacing: "1px",
              marginBottom: "20px",
            }}
          >
            <div style={{ width: "10%", textAlign: "center" }}>NO</div>
            <div style={{ width: "40%", textAlign: "left" }}>ITEMS</div>
            <div style={{ width: "10%", textAlign: "center" }}>QTY</div>
            <div style={{ width: "20%", textAlign: "center" }}>PRICE</div>
            <div style={{ width: "20%", textAlign: "center" }}>SUBTOTAL</div>
          </div>

          {items.map((item, index) => {
            // Handle buyback vs regular items differently
            const isBuyback = item.is_buyback;

            let qtyDisplay, priceSymbol, priceAmount, subtotalSymbol, subtotalAmount;

            if (isBuyback) {
              // Buyback item: show gram and buyback_rate
              qtyDisplay = `${item.gram}g`;
              const priceData = splitCurrency(item.buyback_rate || 0);
              priceSymbol = priceData.symbol;
              priceAmount = `${priceData.amount}/g`;
              const totalData = splitCurrency(item.total || 0);
              subtotalSymbol = totalData.symbol;
              subtotalAmount = totalData.amount;
            } else {
              // Regular item: show quantity and price
              qtyDisplay = item.quantity;
              const priceData = splitCurrency(item.price || 0);
              priceSymbol = priceData.symbol;
              priceAmount = priceData.amount;
              const subtotalData = splitCurrency(item.subtotal || 0);
              subtotalSymbol = subtotalData.symbol;
              subtotalAmount = subtotalData.amount;
            }

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  padding: "0 12px 12px 12px",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "13pt",
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
                  style={{
                    width: "40%",
                    fontWeight: "500",
                    color: "#2d2d2d",
                    textAlign: "left",
                  }}
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
                  {qtyDisplay}
                </div>
                <div
                  style={{
                    width: "20%",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "8px",
                    paddingLeft: "8px",
                    alignItems: "center",
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
                    paddingRight: "8px",
                    paddingLeft: "8px",
                    alignItems: "center",
                    fontWeight: "400",
                    color: "#2d2d2d",
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
          }}
        >
          <div style={{ width: "320px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 20px 12px 12px",
                fontSize: "13pt",
                color: "#666666",
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
                  padding: "0 20px 12px 12px",
                  fontSize: "13pt",
                  color: "#666666",
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
                padding: "0 20px 12px 12px",
                fontSize: "13pt",
                color: "#666666",
                borderBottom: `1px solid ${brandColor}`,
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
                padding: "0px 12px",
                fontSize: "19pt",
                fontWeight: "400",
                color: brandColor,
              }}
            >
              <span>Total</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  minWidth: "120px",
                  paddingRight: "8px",
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

        {/* Note */}
        {invoice.note && (
          <div
            style={{
              marginBottom: "50px",
              padding: "12px 20px 20px 20px",
              backgroundColor: "#fafafa",
              borderLeft: `2px solid ${brandColor}`,
            }}
          >
            <div
              style={{
                fontSize: "12pt",
                color: brandColor,
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              NOTE
            </div>
            <div
              style={{
                fontSize: "13pt",
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
                    fontSize: "12pt",
                    color: brandColor,
                    letterSpacing: "2px",
                    marginBottom: "6px",
                  }}
                >
                  PAYMENT
                </div>
                <div
                  style={{
                    fontSize: "13pt",
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
                  fontSize: "12pt",
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
                  fontSize: "13pt",
                  color: brandColor,
                  fontWeight: "500",
                }}
              >
                {storeSettings.adminName}
              </div>
              {storeSettings?.adminTitle && (
                <div
                  style={{
                    fontSize: "12pt",
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
