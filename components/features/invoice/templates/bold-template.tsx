"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps, DEFAULT_BRAND_COLOR } from "../types";
import { calculateTotal } from "@/lib/utils/invoice-calculation";

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

  // Check if this is a buyback invoice
  const isBuybackInvoice = items.some(item => item.is_buyback);

  // Format invoice number for buyback
  const displayNumber = isBuybackInvoice
    ? invoiceNumber.replace(/^INV-/, 'BUY-')
    : invoiceNumber;

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
                  }}
                />
              )}

              <div>
                <div
                  style={{
                    fontSize: "28pt",
                    fontWeight: "900",
                    lineHeight: "1.2",
                  }}
                >
                  {storeSettings?.name || "YOUR STORE"}
                </div>

                {storeSettings?.storeDescription && (
                  <div style={{ fontSize: "11pt", opacity: 0.9 }}>
                    {storeSettings.storeDescription}
                  </div>
                )}
                {storeSettings?.storeNumber && (
                  <div>
                    <span style={{ fontWeight: "700" }}>ID:</span>{" "}
                    {storeSettings.storeNumber}
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
                padding: "8px 14px 16px 14px",
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
                  {displayNumber}
                </div>
                <div>
                  <span style={{ fontWeight: "700" }}>Date:</span>{" "}
                  {formatDate(new Date(invoiceDate))}
                </div>
              </div>
            </div>

            {/* Customer */}
            <div
              style={{
                flex: 1,
                border: `4px solid #000000`,
                padding: "8px 14px 16px 14px",
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
                      marginTop: "18px",
                      display: "inline-block",
                      padding: "0px 12px 14px 12px",
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
                padding: "0px 14px 16px 14px",
                fontSize: "10pt",
                fontWeight: "900",
              }}
            >
              <div style={{ width: "10%", textAlign: "center" }}>NO</div>
              <div style={{ width: "44%", textAlign: "left" }}>ITEMS</div>
              <div style={{ width: "10%", textAlign: "center" }}>QTY</div>
              <div style={{ width: "18%", textAlign: "center" }}>PRICE</div>
              <div style={{ width: "18%", textAlign: "center" }}>SUBTOTAL</div>
            </div>

            {items.map((item, index) => {
              // Handle buyback vs regular items differently
              const isBuyback = item.is_buyback;

              let qtyDisplay, priceSymbol, priceAmount, subtotalSymbol, subtotalAmount;

              if (isBuyback) {
                // Buyback item: show gram and buyback_rate
              // Buyback item: show gram × quantity if applicable
              const qty = item.quantity || 1;
              const totalGram = (item.gram || 0) * qty;

              if (qty > 1) {
                qtyDisplay = `${item.gram}g × ${qty} = ${totalGram.toFixed(3)}g`;
              } else {
                qtyDisplay = `${item.gram}g`;
              }
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
                    padding: "0px 14px 16px 14px",
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: "10pt",
                    backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                  }}
                >
                  <div
                    style={{
                      width: "10%",
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
                      textAlign: "left",
                    }}
                  >
                    {item.description}
                  </div>
                  <div
                    style={{
                      width: "10%",
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    {qtyDisplay}
                  </div>
                  <div
                    style={{
                      width: "18%",
                      display: "flex",
                      justifyContent: "space-between",
                      paddingRight: "8px",
                      paddingLeft: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span>{priceSymbol}</span>
                    <span style={{ textAlign: "right", flex: 1 }}>
                      {priceAmount}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "18%",
                      display: "flex",
                      justifyContent: "space-between",
                      paddingRight: "8px",
                      paddingLeft: "8px",
                      alignItems: "center",
                      fontWeight: "700",
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
                  border: `3px solid ${brandColor}`,
                  padding: "8px 20px",
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
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {invoice.note}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            <div style={{ width: "327px" }}>
              <div
                style={{
                  border: "3px solid #000000",
                  padding: "8px 14px 16px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0px 5px 16px 5px",
                    fontSize: "10pt",
                    fontWeight: "700",
                  }}
                >
                  <span>SUBTOTAL</span>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "100px",
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
                      padding: "0px 5px 16px 5px",
                      fontSize: "10pt",
                      fontWeight: "700",
                    }}
                  >
                    <span>TAX ({taxPercentage}%)</span>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        minWidth: "100px",
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
                    padding: "0px 5px 16px 5px",
                    borderBottom: "2px solid #000000",
                    fontSize: "10pt",
                    fontWeight: "700",
                  }}
                >
                  <span>SHIPPING</span>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "100px",
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
                    padding: "0px 14px 16px 14px",
                    backgroundColor: brandColor,
                    color: "#ffffff",
                    fontSize: "16pt",
                    fontWeight: "900",
                  }}
                >
                  <span>TOTAL</span>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      minWidth: "100px",
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
