import React from 'react'
import { Invoice, StoreSettings } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface HiddenInvoiceRenderProps {
  invoice: Invoice
  storeSettings: StoreSettings | null
}

export function HiddenInvoiceRender({ invoice, storeSettings }: HiddenInvoiceRenderProps) {
  const { customer, items, subtotal, shippingCost, total, invoiceNumber, invoiceDate } = invoice
  const brandColor = storeSettings?.brandColor || '#d4af37'

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
      <div
        id="invoice-content"
        style={{
          width: "794px",
          padding: "40px",
          fontSize: "10pt",
          fontFamily: "Helvetica, Arial, sans-serif",
          backgroundColor: "#ffffff",
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
          <div style={{ display: "flex", width: "60%", alignItems: "center" }}>
            {storeSettings?.logo && (
              <img
                src={storeSettings.logo}
                alt="Store Logo"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "contain",
                  marginRight: "12px",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "16pt",
                  fontWeight: "bold",
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                {storeSettings?.name || "Your Store Name"}
              </div>
              <div
                style={{
                  fontSize: "9pt",
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
                fontSize: "28pt",
                fontWeight: "bold",
                color: brandColor,
                marginBottom: "5px",
              }}
            >
              INVOICE
            </div>
            <div
              style={{
                fontSize: "9pt",
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
              fontSize: "9pt",
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
              backgroundColor: "#f9fafb",
              padding: "12px",
              borderRadius: "6px",
              borderLeft: `3px solid ${brandColor}`,
            }}
          >
            <div
              style={{
                fontSize: "12pt",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "4px",
              }}
            >
              {customer.name}
            </div>
            <div
              style={{
                fontSize: "9pt",
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
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "9pt",
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: "8%" }}>No</div>
            <div style={{ width: "44%" }}>Description</div>
            <div style={{ width: "12%", textAlign: "right" }}>Qty</div>
            <div style={{ width: "18%", textAlign: "right" }}>Price</div>
            <div style={{ width: "18%", textAlign: "right" }}>Subtotal</div>
          </div>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #e5e7eb",
                padding: "8px 8px 16px 8px",
                fontSize: "9pt",
                backgroundColor: index % 2 === 1 ? "#f9fafb" : "#ffffff",
              }}
            >
              <div style={{ width: "8%" }}>{index + 1}</div>
              <div
                style={{
                  width: "44%",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {item.description}
              </div>
              <div style={{ width: "12%", textAlign: "right" }}>
                {item.quantity}
              </div>
              <div style={{ width: "18%", textAlign: "right" }}>
                {formatCurrency(item.price)}
              </div>
              <div style={{ width: "18%", textAlign: "right" }}>
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
            marginBottom: "20px",
          }}
        >
          <div style={{ width: "220px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                paddingBottom: "16px",
                fontSize: "10pt",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "6px",
                paddingBottom: "16px",
                fontSize: "10pt",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>Ongkos Kirim:</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "16px",
                fontSize: "14pt",
                fontWeight: "bold",
                borderTop: `2px solid ${brandColor}`,
              }}
            >
              <span>Total:</span>
              <span style={{ color: brandColor }}>
                {formatCurrency(total)}
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
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10pt",
                fontWeight: "bold",
                color: brandColor,
                lineHeight: "1.5",
              }}
            >
              <div>Terus berinvestasi untuk masa depan,</div>
              <div>Terima kasih!</div>
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
                  fontSize: "9pt",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Hormat Kami
              </div>
              <div
                style={{
                  fontFamily: "'Brush Script MT', cursive",
                  fontSize: "32pt",
                  color: brandColor,
                  marginBottom: "16px",
                  fontWeight: 400,
                }}
              >
                {storeSettings.adminName}
              </div>
              <div
                style={{
                  borderTop: "2px solid #111827",
                  width: "150px",
                  marginTop: "5px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
