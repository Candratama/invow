import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import { Invoice, StoreSettings } from './types'
import { formatCurrency, formatDate } from './utils'

// Register cursive font for signature (similar to Brush Script MT)
Font.register({
  family: 'Satisfy',
  src: 'https://fonts.gstatic.com/s/satisfy/v21/rP2Hp2yn6lkG50LoOZSCHBeHFl0.ttf',
  fontWeight: 400,
})

interface InvoiceDocumentProps {
  invoice: Invoice
  storeSettings: StoreSettings | null
}

export async function generateInvoicePDF(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<Blob> {
  const blob = await pdf(
    <InvoiceDocument invoice={invoice} storeSettings={storeSettings} />
  ).toBlob()
  return blob
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, storeSettings }) => {
  const { customer, items, subtotal, shippingCost, total, invoiceNumber, invoiceDate } = invoice
  const brandColor = storeSettings?.brandColor || '#d4af37'

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottom: `2pt solid ${brandColor}`,
    },
    storeInfo: {
      flexDirection: 'row',
      width: '60%',
    },
    storeLogo: {
      width: 60,
      height: 60,
      marginRight: 12,
    },
    storeText: {
      flex: 1,
    },
    storeName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: '#111827',
    },
    storeDetails: {
      fontSize: 9,
      color: '#6b7280',
      lineHeight: 1.4,
    },
    invoiceTitle: {
      width: '40%',
      textAlign: 'right',
      paddingRight: 10,
    },
    invoiceTitleText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: brandColor,
      marginBottom: 5,
    },
    invoiceMeta: {
      fontSize: 9,
      color: '#6b7280',
      lineHeight: 1.5,
    },
    invoiceMetaStrong: {
      color: '#111827',
      fontWeight: 'bold',
    },
    customerSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    customerInfo: {
      backgroundColor: '#f9fafb',
      padding: 12,
      borderRadius: 6,
      borderLeft: `3pt solid ${brandColor}`,
    },
    customerName: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    customerDetails: {
      fontSize: 9,
      color: '#6b7280',
      lineHeight: 1.4,
    },
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: brandColor,
      padding: 8,
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 9,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottom: '1pt solid #e5e7eb',
      padding: 8,
      fontSize: 9,
    },
    tableRowEven: {
      backgroundColor: '#f9fafb',
    },
    colNo: { width: '8%' },
    colDescription: { width: '44%' },
    colQty: { width: '12%', textAlign: 'right' },
    colPrice: { width: '18%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    itemDescription: {
      fontWeight: 'bold',
      color: '#111827',
    },
    totalsSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 20,
      position: 'relative',
    },
    totalsTable: {
      width: 220,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      fontSize: 10,
    },
    totalsRowSubtotal: {
      color: '#6b7280',
      borderBottom: '1pt solid #e5e7eb',
    },
    totalsRowTotal: {
      fontSize: 14,
      fontWeight: 'bold',
      paddingTop: 10,
      borderTop: `2pt solid ${brandColor}`,
    },
    totalsAmount: {
      color: brandColor,
      fontWeight: 'bold',
    },
    lunasStamp: {
      position: 'absolute',
      top: -15,
      left: 15,
      transform: 'rotate(-12deg)',
      fontSize: 28,
      fontWeight: 'bold',
      color: brandColor,
      letterSpacing: 2,
      opacity: 0.5,
      width: 120,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 20,
      borderTop: '1pt solid #e5e7eb',
      marginTop: 20,
    },
    greeting: {
      fontSize: 10,
      fontWeight: 'bold',
      color: brandColor,
      lineHeight: 1.5,
    },
    greetingSmall: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 8,
    },
    signature: {
      textAlign: 'center',
      minWidth: 150,
      marginRight: 10,
    },
    signatureLabel: {
      fontSize: 9,
      color: '#374151',
      marginBottom: 18,
    },
    signatureName: {
      fontFamily: 'Satisfy',
      fontSize: 40,
      color: brandColor,
      marginBottom: 8,
      fontWeight: 400,
    },
    signatureLine: {
      borderTop: '2pt solid #111827',
      width: 150,
      marginTop: 5,
    },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.storeInfo}>
            {storeSettings?.logo && (
              <Image src={storeSettings.logo} style={styles.storeLogo} />
            )}
            <View style={styles.storeText}>
              <Text style={styles.storeName}>
                {storeSettings?.name || 'Your Store Name'}
              </Text>
              <View style={styles.storeDetails}>
                <Text>{storeSettings?.address || 'Store Address'}</Text>
                <Text>WhatsApp: {storeSettings?.whatsapp || '+62 XXX XXX XXX'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>INVOICE</Text>
            <View style={styles.invoiceMeta}>
              <Text>
                <Text style={styles.invoiceMetaStrong}>Invoice #:</Text> {invoiceNumber}
              </Text>
              <Text>
                <Text style={styles.invoiceMetaStrong}>Date:</Text> {formatDate(new Date(invoiceDate))}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <View style={styles.customerDetails}>
              <Text>{customer.address || 'No address provided'}</Text>
              {customer.status && <Text>Status: {customer.status}</Text>}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colTotal}>Subtotal</Text>
          </View>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={[styles.colDescription, styles.itemDescription]}>
                {item.description}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={[styles.totalsRow, styles.totalsRowSubtotal]}>
              <Text>Subtotal:</Text>
              <Text>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsRowSubtotal]}>
              <Text>Ongkos Kirim:</Text>
              <Text>{formatCurrency(shippingCost)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsRowTotal]}>
              <Text>Total:</Text>
              <Text style={styles.totalsAmount}>{formatCurrency(total)}</Text>
            </View>
          </View>
          {/* LUNAS Stamp */}
          <View style={styles.lunasStamp}>
            <Text>[LUNAS]</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <View style={styles.greeting}>
              <Text>Terus berinvestasi untuk masa depan,</Text>
              <Text>Terima kasih!</Text>
            </View>
            <Text style={styles.greetingSmall}>
              Generated on {formatDate(new Date())}
            </Text>
          </View>

          {storeSettings?.adminName && (
            <View style={styles.signature}>
              <Text style={styles.signatureLabel}>Hormat Kami</Text>
              <Text style={styles.signatureName}>{storeSettings.adminName}</Text>
              <View style={styles.signatureLine} />
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
