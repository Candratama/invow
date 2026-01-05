# Dashboard, Customers & Report Improvements

**Date:** 2026-01-05
**Status:** Approved

## Overview

Tiga perubahan utama:
1. Hapus Net Profit Card di dashboard
2. Tambah filter status & pagination di halaman Customers
3. Tambah 3 tabel Top 5 berdasarkan status di Overview Report

---

## 1. Hapus Net Profit Card

**File:** `components/features/dashboard/financial-cards.tsx`

**Perubahan:**
- Hapus komponen `NetProfitCard`
- Hapus dari grid `FinancialCards`
- Grid berubah dari 4 kolom menjadi 3 kolom

**Impact:**
- Tidak ada perubahan database
- Tidak perlu update types
- Hanya perubahan UI di satu file

---

## 2. Filter Status & Pagination di Customers

**File:** `app/dashboard/customers/customers-client.tsx`

### Filter Status

```
┌──────────────┬──────────────┬──────────────┐
│   Customer   │   Reseller   │  Distributor │
└──────────────┴──────────────┴──────────────┘
```

- Lokasi: di bawah search bar, di atas list customers
- Style: button group, full width, 3 kolom sama rata
- Behavior: **multi-select** (bisa pilih lebih dari satu)
- Default: semua status terpilih (3 tombol aktif)
- Tombol aktif: background primary
- Tombol non-aktif: outline/ghost
- Minimal 1 status harus aktif

### Pagination

```
┌─────────────────────────────────────────────────────┐
│  Showing 1-10 of 45     │ 10 ▼ │  < 1 2 3 4 5 >    │
└─────────────────────────────────────────────────────┘
```

- Lokasi: di bawah list customers
- Dropdown pilihan: 10 / 25 / 50 per halaman
- Tampilkan info "Showing X-Y of Z"
- Filtering dilakukan client-side

---

## 3. Top 5 Tables di Overview Report

**File:** `app/dashboard/report/components/overview-tab.tsx`

### Layout (stack vertical)

Urutan tabel:
1. Top 5 Customer
2. Top 5 Reseller
3. Top 5 Distributor

### Struktur Tabel

```
┌─────────────────────────────────────────────────────┐
│  Top 5 Customer                                     │
├──────┬──────────────────┬────────────┬─────────────┤
│  #   │  Nama            │  Transaksi │  Total      │
├──────┼──────────────────┼────────────┼─────────────┤
│  1   │  Toko Emas ABC   │  12x       │  Rp 45.5jt  │
│  2   │  ...             │  ...       │  ...        │
└──────┴──────────────────┴────────────┴─────────────┘
```

### Kolom

| Kolom | Deskripsi |
|-------|-----------|
| # | Ranking 1-5 |
| Nama | Nama customer |
| Transaksi | Jumlah transaksi (format: "12x") |
| Total | Total nilai transaksi (format currency) |

### Logic

- Ranking berdasarkan total nilai transaksi (descending)
- Filter berdasarkan date range yang dipilih
- Jika status tidak punya data, tampilkan "Belum ada data"

---

## Files to Modify

1. `components/features/dashboard/financial-cards.tsx` — hapus NetProfitCard
2. `app/dashboard/customers/customers-client.tsx` — tambah filter & pagination
3. `app/dashboard/report/components/overview-tab.tsx` — ganti 1 tabel jadi 3 tabel
