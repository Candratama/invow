# Report Page Design

**Date:** 2026-01-04
**Status:** Draft
**Target User:** Pemilik toko/bisnis (performance insights)

## Overview

Halaman report untuk melihat performa bisnis, analisis penjualan, dan customer insights. Termasuk fitur khusus untuk analisis transaksi buyback.

## Requirements

### Fungsional
- Melihat data berdasarkan periode waktu (harian, mingguan, bulanan, custom)
- Metrik gabungan: revenue, volume, dan customer insights
- Section khusus untuk deep dive buyback
- Export data ke PDF dan CSV
- Visualisasi dengan charts dan summary cards

### Non-Fungsional
- Mobile-first responsive design
- Consistent dengan design system existing (mirip settings page)
- Fast loading dengan React Query caching

## Page Structure

**Route:** `/dashboard/report`

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: [← Back]  "Laporan"                        │
├─────────────────────────────────────────────────────┤
│  Tab Navigation (style sama dengan settings):       │
│  [Overview] [Buyback] [Detail]                      │
│     ━━━━━━                                          │
├─────────────────────────────────────────────────────┤
│  Date Range Picker:                                 │
│  [Hari Ini] [Minggu Ini] [Bulan Ini] [Custom ▾]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Content Area (sesuai tab aktif)                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Export Actions (sticky bottom):                    │
│  [Download PDF] [Download CSV]                      │
└─────────────────────────────────────────────────────┘
```

### Tab Navigation
- Style sama persis dengan settings page (`border-b-2`, primary color untuk active)
- Tanpa icon, hanya text

## Tab: Overview

Summary gabungan semua metrik dalam satu view.

### Summary Cards

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total       │ │ Jumlah      │ │ Customer    │
│ Pendapatan  │ │ Invoice     │ │ Aktif       │
│ Rp 15.500K  │ │ 42          │ │ 28          │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Rata-rata   │ │ Invoice     │ │ Invoice     │
│ per Invoice │ │ Regular     │ │ Buyback     │
│ Rp 369K     │ │ 35          │ │ 7           │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Revenue Chart
- Line/Area chart untuk trend pendapatan
- X-axis: tanggal/waktu
- Y-axis: nilai pendapatan
- Tooltip dengan detail per titik

### Top Customers Table

| Customer | Jumlah Invoice | Total Nilai |
|----------|----------------|-------------|
| Budi S.  | 8              | Rp 4.200K   |
| Ani W.   | 5              | Rp 2.800K   |
| Citra D. | 4              | Rp 2.100K   |

Menampilkan 5 customer dengan nilai transaksi tertinggi.

## Tab: Buyback

Analisis khusus transaksi buyback (jual emas/per gram).

### Summary Cards

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total Gram  │ │ Total Nilai │ │ Rata-rata   │
│ Dibeli      │ │ Buyback     │ │ Harga/Gram  │
│ 125.5 gr    │ │ Rp 12.800K  │ │ Rp 1.020K   │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐
│ Jumlah      │ │ Jumlah      │
│ Transaksi   │ │ Customer    │
│ 7           │ │ 5           │
└─────────────┘ └─────────────┘
```

### Buyback Trend Chart
- Bar/Line chart untuk jumlah gram dibeli per hari/minggu
- Toggle antara view "Gram" atau "Nilai Rupiah"

### Buyback Transactions Table

| Tanggal | Customer | Gram | Rate/Gram | Total |
|---------|----------|------|-----------|-------|
| 3 Jan   | Budi S.  | 25g  | Rp 1.050K | Rp 26.250K |
| 2 Jan   | Ani W.   | 15g  | Rp 1.020K | Rp 15.300K |
| 1 Jan   | Citra D. | 10g  | Rp 1.010K | Rp 10.100K |

Tabel dengan pagination.

## Tab: Detail

Data lengkap semua invoice dalam periode.

### Filter Bar

```
┌─────────────────────────────────────────────────────┐
│ [Semua ▾]  [Search customer/invoice...]        🔍  │
│  ↳ Semua / Regular / Buyback                        │
└─────────────────────────────────────────────────────┘
```

### Invoice Table

| No Invoice | Tanggal | Customer | Tipe | Items | Total |
|------------|---------|----------|------|-------|-------|
| INV-001 | 3 Jan 2026 | Budi Santoso | Regular | 5 | Rp 2.500K |
| INV-002 | 3 Jan 2026 | Ani Wijaya | Buyback | 1 | Rp 1.050K |
| INV-003 | 2 Jan 2026 | Citra Dewi | Regular | 3 | Rp 890K |

### Table Features
- Sortable columns
- Pagination (10/25/50 items per page)
- Search by customer name atau nomor invoice
- Type filter (Semua / Regular / Buyback)
- Row click untuk expand detail items (opsional)

## Export Features

### PDF Export
- Layout rapi dengan header (nama toko, periode, tanggal generate)
- Isi sesuai tab aktif:
  - Overview: Summary cards + chart snapshot + top customers
  - Buyback: Summary + buyback chart + transactions table
  - Detail: Full table dengan semua data
- Footer: "Generated by Invow"

### CSV Export
- Raw data format spreadsheet
- Columns: No Invoice, Tanggal, Customer, Tipe, Items, Subtotal, Shipping, Total
- Buyback columns: Gram, Rate/Gram
- Filter-aware (export sesuai filter aktif)

### Export Bar (Sticky Bottom)
- Fixed di bottom screen (mobile-friendly)
- Disabled state jika tidak ada data
- Loading state saat generate file

## File Structure

```
app/dashboard/report/
├── page.tsx                 # Server component wrapper
├── report-client.tsx        # Client component utama
└── components/
    ├── overview-tab.tsx     # Tab Overview
    ├── buyback-tab.tsx      # Tab Buyback
    ├── detail-tab.tsx       # Tab Detail
    ├── date-range-picker.tsx
    ├── summary-card.tsx
    ├── revenue-chart.tsx
    ├── export-bar.tsx
    └── invoice-table.tsx
```

## Data Requirements

### Supabase Tables
- `invoices` - filter by date range & user_id
- `invoice_items` - untuk detail items & buyback data
- `customers` - untuk top customers aggregation

### Queries Needed
1. **Summary stats** - Aggregate totals, counts by type
2. **Revenue trend** - Daily/weekly grouping
3. **Top customers** - Group by customer, order by total
4. **Buyback stats** - Filter is_buyback=true, aggregate gram
5. **Invoice list** - Paginated, sortable, filterable

## Technical Stack

| Component | Technology |
|-----------|------------|
| Charts | Recharts (existing in admin) |
| PDF Export | Existing image export service atau jsPDF |
| CSV Export | Client-side blob generation |
| Data Fetching | React Query |
| Date Picker | Custom component atau date-fns |
| Tables | Custom dengan sorting/pagination |

## Feature Summary

| Fitur | Deskripsi |
|-------|-----------|
| Date Range | Preset (hari/minggu/bulan) + custom picker |
| 3 Tabs | Overview, Buyback, Detail |
| Summary Cards | 6 cards di Overview, 5 di Buyback |
| Charts | Revenue trend + Buyback trend |
| Tables | Top customers + Full invoice list |
| Export | PDF + CSV |
| Mobile-first | Responsive, sticky export bar |

## Next Steps

1. Create data access layer for report queries
2. Build reusable chart components
3. Implement date range picker
4. Build each tab component
5. Add export functionality
6. Testing & optimization
