import React from "react";
import { Invoice, StoreSettings } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface HiddenInvoiceRenderProps {
  invoice: Invoice;
  storeSettings: StoreSettings | null;
  preview?: boolean;
}

export function HiddenInvoiceRender({
  invoice,
  storeSettings,
  preview = false,
}: HiddenInvoiceRenderProps) {
  const {
    customer,
    items,
    subtotal,
    shippingCost,
    total,
    invoiceNumber,
    invoiceDate,
  } = invoice;
  const brandColor = storeSettings?.brandColor || "#d4af37";
  const adminTitle = storeSettings?.adminTitle?.trim() || "Admin Store";
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
  const subtotalCurrency = splitCurrency(subtotal);
  const shippingCurrency = splitCurrency(shippingCost);
  const totalCurrency = splitCurrency(total);

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
          padding: "40px 40px 80px 40px",
          fontSize: "12pt",
          fontFamily: "Helvetica, Arial, sans-serif",
          backgroundColor: "#ffffff",
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
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "15px",
            borderBottom: `2px solid ${brandColor}`,
          }}
        >
          <div style={{ display: "flex", width: "60%", alignItems: "end" }}>
            {storeSettings?.logo && (
              <img
                src={storeSettings.logo}
                alt="Store Logo"
                style={{
                  width: "72px",
                  height: "72px",
                  objectFit: "contain",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "19pt",
                  fontWeight: "bold",
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                {storeSettings?.name || "Your Store Name"}
              </div>
              <div
                style={{
                  fontSize: "10pt",
                  color: "#6b7280",
                  lineHeight: "1.4",
                }}
              >
                <div>{storeSettings?.address || "Store Address"}</div>
                <div>
                  WhatsApp: {storeSettings?.whatsapp || "+62 XXX XXX XXX"}
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              width: "40%",
              textAlign: "right",
              paddingRight: "5px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "31pt",
                fontWeight: "bold",
                color: brandColor,
                marginBottom: "5px",
              }}
            >
              INVOICE
            </div>
            <div
              style={{
                fontSize: "10pt",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              <div>
                <span style={{ color: "#111827", fontWeight: "bold" }}>
                  Invoice:
                </span>{" "}
                {invoiceNumber}
              </div>
              <div>
                <span style={{ color: "#111827", fontWeight: "bold" }}>
                  Date:
                </span>{" "}
                {formatDate(new Date(invoiceDate))}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "12px",
              borderRadius: "8px",
              borderLeft: `3px solid ${brandColor}`,
            }}
          >
            <div
              style={{
                fontSize: "10pt",
                fontWeight: "bold",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Bill To:
            </div>
            <div
              style={{
                fontSize: "15pt",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "4px",
              }}
            >
              {customer.name}
            </div>
            <div
              style={{
                fontSize: "10pt",
                color: "#6b7280",
                lineHeight: "1.4",
              }}
            >
              <div>{customer.address || "No address provided"}</div>
              {customer.status && <div>Status: {customer.status}</div>}
              <br />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: brandColor,
              padding: "8px 8px 16px 8px",
              borderRadius: "8px",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "10pt",
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: "8%", textAlign: "center" }}>No</div>
            <div style={{ width: "44%", textAlign: "left" }}>Description</div>
            <div style={{ width: "12%", textAlign: "center" }}>Qty</div>
            <div style={{ width: "18%", textAlign: "center" }}>Price</div>
            <div style={{ width: "18%", textAlign: "center" }}>Subtotal</div>
          </div>
          {items.map((item, index) => {
            const { symbol: priceSymbol, amount: priceAmount } = splitCurrency(
              item.price,
            );
            const { symbol: subtotalSymbol, amount: subtotalAmount } =
              splitCurrency(item.subtotal);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px 8px 16px 8px",
                  fontSize: "11pt",
                  backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
                }}
              >
                <div style={{ width: "8%", textAlign: "center" }}>
                  {index + 1}
                </div>
                <div
                  style={{
                    width: "44%",
                    fontWeight: "bold",
                    color: "#111827",
                    textAlign: "left",
                  }}
                >
                  {item.description}
                </div>
                <div style={{ width: "12%", textAlign: "center" }}>
                  {item.quantity}
                </div>
                <div
                  style={{
                    width: "18%",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "8px",
                    paddingLeft: "8px",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{priceSymbol}</span>
                  <span
                    style={{
                      flex: 1,
                      textAlign: "right",
                    }}
                  >
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
                    gap: "6px",
                  }}
                >
                  <span>{subtotalSymbol}</span>
                  <span style={{ flex: 1, textAlign: "right" }}>
                    {subtotalAmount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note Section */}
        {invoice.note && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              borderLeft: `3px solid ${brandColor}`,
            }}
          >
            <div
              style={{
                fontSize: "10pt",
                fontWeight: "bold",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              Note:
            </div>
            <div
              style={{
                fontSize: "10pt",
                color: "#374151",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                paddingBottom: "16",
              }}
            >
              {invoice.note}
            </div>
          </div>
        )}

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "20px",
            marginRight: "16px",
          }}
        >
          <div style={{ width: "260px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                paddingBottom: "16px",
                fontSize: "12pt",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>Subtotal:</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  paddingLeft: "24px",
                  minWidth: "140px",
                }}
              >
                <span>{subtotalCurrency.symbol}</span>
                <span style={{ textAlign: "right", flex: 1 }}>
                  {subtotalCurrency.amount}
                </span>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                paddingBottom: "16px",
                fontSize: "12pt",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>Shipping:</span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  paddingLeft: "24px",
                  minWidth: "140px",
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
                paddingTop: "16px",
                gap: "16px",
                fontSize: "19pt",
                fontWeight: "bold",
                borderTop: `2px solid ${brandColor}`,
              }}
            >
              <span>Total: </span>
              <span
                style={{
                  color: brandColor,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  minWidth: "140px",
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

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "20px",
            borderTop: "1px solid #e5e7eb",
            marginTop: "20px",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12pt",
                color: brandColor,
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: "bold" }}>Terima kasih!</div>
              <div>Semua bisa punya emas</div>
            </div>
          </div>

          {storeSettings?.adminName && (
            <div
              style={{
                textAlign: "center",
                minWidth: "150px",
                marginRight: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "10pt",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Hormat Kami
              </div>
              <div
                style={{
                  fontSize: "24pt",
                  color: brandColor,
                  marginBottom: "0px",
                  fontWeight: "bold",
                }}
              >
                {storeSettings.adminName}
              </div>
              <div
                style={{
                  borderTop: "2px solid #111827",
                  width: "150px",
                  marginTop: "10px",
                  marginBottom: "5px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />
              {adminTitle && (
                <div
                  style={{
                    fontSize: "10pt",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  {adminTitle}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
