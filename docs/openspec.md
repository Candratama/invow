# Simple Invoice OpenSpec

## Context
- Build an offline-friendly Next.js (App Router) invoicing tool for Rahfi Gold following PRD 8nmvx5cq.
- Operates entirely client-side: no authentication, no backend persistence, data stored locally.
- Must support Indonesian locale, responsive UI, and exportable invoices with a permanent "[LUNAS]" watermark.

## Goals
- Provide a frictionless invoice drafting flow with autosave and offline continuity.
- Enable store owners to configure branding and persist settings locally.
- Deliver reliable print/PDF exports that respect localized formatting and branding.

## Non-Goals
- No server APIs, sync, or multi-user collaboration.
- No third-party authentication or Supabase integration.
- No payment processing or external invoice delivery integrations.

## Target Users & Scenarios
- **Store admin** maintains store identity (name, contact, colors, logo) and installs the PWA for offline use.
- **Staff** drafts invoices for customers, resumes drafts after reload, previews totals, and prints or saves PDFs.

## Functional Scope
### Store Settings
- Modal accessible from header gear icon.
- Inputs: store name, address, phone, admin name, brand color (default `#B8860B`), optional logo upload handling base64 encoding.
- Persist configuration in IndexedDB (`stores` object store) with immediate read-back for subsequent sessions.
- Surface PWA installation button when `beforeinstallprompt` is available.

### Invoice Drafting
- Form fields: customer name, address, status dropdown (`Distributor`, `Reseller`, `Customer`), invoice date (defaults to today but resets on new visit), invoice number (initial `INV-DDMMYY-001` and preserve draft value), shipping (numeric), notes.
- Items editor with dynamic rows, fields for item name, price, quantity (default 0). Enforce numeric entry and display id-ID currency formatting helpers.
- Autosave entire draft to IndexedDB (`invoice_drafts` store) with 1s debounce and restoration on reload (date re-defaults to current day).
- Real-time derived subtotal (`sum(price * qty)`) and total (`subtotal + shipping`). Computations memoized/derived to avoid redundant recalculations.

### Validation & Preview
- Validate on preview/download trigger: require customer name, at least one item with non-empty name, price > 0, quantity > 0.
- Inline error messaging for invalid fields; block preview when invalid.
- Preview modal uses store brand color accents and includes optional logo placeholder.
- Always render "[LUNAS]" watermark beneath total area.
- Integrate `react-to-print` for export, triggering system print dialog with filename `Invoice_[NamaPembeli]_DDMMYY.pdf`.

### Offline & PWA
- Integrate `next-pwa` with App Router setup; enable auto-updates and Workbox runtime caching for HTML, JS, CSS, images, fonts.
- Provide `manifest.json` (name/short_name, theme color `#B8860B`, background `#ffffff`, start_url `/`, standalone display, icons 192px & 512px).
- Include supporting assets: robots.txt, favicon, splash-friendly meta tags.
- Ensure previously visited routes render offline from cache.

### Accessibility & Responsiveness
- Tailwind-driven responsive layout (mobile-first) with accessible form controls and modal interactions.
- Ensure keyboard navigation through inputs, controls, and modals.
- Maintain sufficient contrast between brand color accents and white backgrounds (adjust classes or variants as needed).

## Technical Decisions
- Next.js (App Router) with TypeScript and Tailwind CSS for UI development.
- IndexedDB abstraction layer with in-memory fallback when IndexedDB unavailable.
- Debounced autosave via `useEffect`/`setTimeout` pattern.
- Utilize `next/font` for optimized typography if branding requires.
- Localization utilities use `Intl.NumberFormat('id-ID')` for currency; all default copy in Bahasa Indonesia.

## Data Model
| Store | Fields | Notes |
| ----- | ------ | ----- |
| `stores` | `{ id: 'default', name, address, phone, admin, brandColor, logoBase64?, ts }` | Single-record store; update `ts` on save. |
| `invoice_drafts` | `{ id: 'current', customer, address, date, status, items[], shipping, notes, invoice_number, ts }` | Maintain existing invoice number on load; items array with `{ id, name, price, qty }`. |

In-memory fallback keeps latest values in React state if IndexedDB operations fail, logging a warning for diagnostics.

## Acceptance Highlights
- `npm run build` (or `pnpm`) succeeds; lint rules uphold TypeScript and Tailwind conventions.
- PWA install prompt available; offline access serves cached pages.
- Store settings persist across reloads and rehydrate UI immediately.
- Invoice drafts autosave/restore seamlessly; totals recalc in <200ms interactions.
- Preview modal matches branding, renders watermark, and prints with expected filename.

## Draft Task Breakdown
| Task | Description | Size | Priority | Acceptance Notes |
| ---- | ----------- | ---- | -------- | ---------------- |
| Scaffold app + PWA foundation | Initialize Next.js TS App Router project, Tailwind, `next-pwa`, manifest/robots/assets, and confirm offline caching & build stability. | large | high | `next build` passes; PWA install prompt works; offline serves cached pages. |
| IndexedDB service utilities | Implement `services/db.ts` with init/get/put/clear helpers for `stores` and `invoice_drafts`, plus in-memory fallback with warnings. | medium | high | CRUD operations succeed in modern browsers; fallback activates gracefully on failure. |
| Store Settings UI (modal) | Build settings modal with inputs, color picker default `#B8860B`, logo upload (base64), persistence to `stores`, and conditional PWA install button. | medium | high | Saved settings reload correctly; install button appears when eligible. |
| Invoice form + autosave | Craft invoice form with required fields, status dropdown, invoice numbering logic, dynamic items editor, and 1s debounced autosave to `invoice_drafts`. | large | high | Draft survives reload; line items manageable; derived values memoized. |
| Real-time calculation + validation | Implement subtotal/total derivations, inline errors, and preview gating per validation rules. | medium | high | Invalid forms blocked from preview; calculations correct across scenarios. |
| Invoice preview + PDF export | Build full-width modal preview honoring branding/logo, embed "[LUNAS]" watermark, integrate `react-to-print` for exports with localized filename. | medium | high | Preview matches design, prints accurately, watermark visible. |
| Accessibility/responsiveness/UX polish | Apply responsive Tailwind layouts, ensure keyboard support, verify brand color contrast guidance. | small | medium | Functional on mobile/desktop; keyboard-only flow works. |
| QA scripts and docs | Configure lint/tsconfig, package scripts (`dev`,`build`,`lint`), and author README with setup, PWA install, and offline testing instructions. | small | low | Build and lint succeed; README covers usage and offline guidance. |

## Open Questions
- Confirm preferred default typography and whether custom fonts are provided.
- Clarify if invoice numbering should increment per draft completion or remain manual beyond default seed.

