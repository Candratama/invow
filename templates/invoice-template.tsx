import { Invoice, StoreSettings } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceTemplateProps {
  invoice: Invoice
  storeSettings: StoreSettings | null
}

export function generateInvoiceHTML({ invoice, storeSettings }: InvoiceTemplateProps): string {
  const { customer, items, subtotal, shippingCost, total, invoiceNumber, invoiceDate } = invoice
  const brandColor = storeSettings?.brandColor || '#d4af37'

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Windsong:wght@400;500&display=block" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Windsong:wght@400;500&display=block');
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #111827;
      background: white;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
    }
    
    .header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${brandColor};
    }
    
    .store-info {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    
    .store-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      flex-shrink: 0;
    }
    
    .store-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .store-name {
      font-size: 20px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 5px;
      line-height: 1.2;
    }
    
    .store-details {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .invoice-title {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 16px;
    }
    
    .invoice-title h1 {
      font-size: 32px;
      font-weight: bold;
      color: ${brandColor};
      margin-bottom: 0;
      line-height: 1.2;
    }
    
    .invoice-meta {
      font-size: 12px;
      color: #6b7280;
    }
    
    .invoice-meta div {
      margin-bottom: 0;
    }
    
    .invoice-meta strong {
      color: #111827;
      font-weight: 600;
    }
    
    .signature-name {
      font-family: 'Brush Script MT', 'Windsong', cursive !important;
      font-size: 48px;
      font-weight: 500;
      color: ${brandColor};
      margin-bottom: 10px;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'Windsong';
      font-style: normal;
      font-weight: 400;
      src: url('https://fonts.gstatic.com/s/windsong/v5/KR1WBsyu-P-GFEW57r95HdG6vjH3.woff2') format('woff2');
      font-display: block;
    }
    
    @font-face {
      font-family: 'Windsong';
      font-style: normal;
      font-weight: 500;
      src: url('https://fonts.gstatic.com/s/windsong/v5/KR1RBsyu-P-GFEW57oeNNPWylS3-jVXm.woff2') format('woff2');
      font-display: block;
    }
    
    .customer-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .customer-info {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid ${brandColor};
    }
    
    .customer-name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 5px;
    }
    
    .customer-details {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table thead {
      background: ${brandColor};
      color: white;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }
    
    .items-table {
      border-radius: 8px;
      overflow: hidden;
    }
    
    .items-table tbody {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table tbody tr {
      border-bottom: none;
    }
    
    .items-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .items-table td {
      padding: 12px;
      font-size: 13px;
    }
    
    .item-description {
      font-weight: 500;
      color: #111827;
    }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    
    .totals-table {
      width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .totals-row.subtotal,
    .totals-row.shipping {
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .totals-row.total {
      font-size: 20px;
      font-weight: bold;
      color: #111827;
      padding-top: 12px;
      border-top: 2px solid ${brandColor};
    }
    
    .totals-row.total .amount {
      color: ${brandColor};
    }
    
    .lunas-stamp {
      position: absolute;
      top: -20px;
      left: 20px;
      transform: rotate(-12deg);
      border: 4px solid ${brandColor};
      border-radius: 8px;
      padding: 8px 24px;
      font-size: 36px;
      font-weight: bold;
      color: ${brandColor};
      letter-spacing: 4px;
      opacity: 0.9;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="store-info">
        ${storeSettings?.logo ? `<img src="${storeSettings.logo}" alt="Store Logo" class="store-logo" />` : ''}
        <div class="store-text">
          <div class="store-name">${storeSettings?.name || 'Your Store Name'}</div>
          <div class="store-details">
            ${storeSettings?.address || 'Store Address'}<br/>
            WhatsApp: ${storeSettings?.whatsapp || '+62 XXX XXX XXX'}
          </div>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-meta">
          <div><strong>Invoice #:</strong> ${invoiceNumber}</div>
          <div><strong>Date:</strong> ${formatDate(new Date(invoiceDate))}</div>
        </div>
      </div>
    </div>

    <!-- Customer Section -->
    <div class="customer-section">
      <div class="section-title">Bill To:</div>
      <div class="customer-info">
        <div class="customer-name">${customer.name}</div>
        <div class="customer-details">
          ${customer.address || 'No address provided'}
          ${customer.status ? `<br/>Status: ${customer.status}` : ''}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">No</th>
          <th>Description</th>
          <th style="width: 80px;">Qty</th>
          <th style="width: 120px;">Price</th>
          <th style="width: 120px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="item-description">${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.subtotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section" style="position: relative;">
      <div class="totals-table">
        <div class="totals-row subtotal">
          <span>Subtotal:</span>
          <span class="amount">${formatCurrency(subtotal)}</span>
        </div>
        <div class="totals-row shipping">
          <span>Ongkos Kirim:</span>
          <span class="amount">${formatCurrency(shippingCost)}</span>
        </div>
        <div class="totals-row total">
          <span>Total:</span>
          <span class="amount">${formatCurrency(total)}</span>
        </div>
      </div>
      <!-- LUNAS Stamp -->
      <div class="lunas-stamp">LUNAS</div>
    </div>

    <!-- Footer with Signature -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-top: 30px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
      <!-- Left: Greeting -->
      <div style="text-align: left;">
        <div style="font-size: 14px; font-weight: 600; color: ${brandColor}; line-height: 1.5;">
          Terus berinvestasi untuk masa depan,<br/>
          Terima kasih!
        </div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 10px;">
          Generated on ${formatDate(new Date())}
        </div>
      </div>

      <!-- Right: Signature -->
      ${storeSettings?.adminName ? `
      <div style="text-align: center; min-width: 200px; margin-right: 16px;">
        <div style="font-size: 12px; color: #374151; margin-bottom: 24px;">
          Hormat Kami
        </div>
        <div class="signature-name">
          ${storeSettings.adminName}
        </div>
        <div style="border-top: 2px solid #111827; width: 200px; margin: 0 auto;"></div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `.trim()
}