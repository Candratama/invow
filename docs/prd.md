Plan implementation for a new Next.js (App Router) app in linked repo simple-invoice (short code: 8nmvx5cq) that fulfills the Rahfi Gold Invoice Generator PRD with these confirmed decisions: no auth/Supabase, offline-first via next-pwa, watermark [LUNAS] always shown below total, status is dropdown [Distributor, Reseller, Customer], logo optional (empty if not uploaded). Key functional areas: store settings persisted in IndexedDB (stores), invoice draft autosave in IndexedDB (invoice_drafts) with 1s debounce, invoice number format INV-DDMMYY-001 (persist existing on draft), real-time subtotal/total calc, validation on preview/PDF, preview modal + react-to-print export Invoice_[NamaPembeli]_DDMMYY.pdf, PWA manifest/icons/theme (#B8860B), responsive UI, Indonesian locale.


Please create draft tasks for repo simple-invoice covering:


Scaffold app + PWA foundation


Create Next.js TypeScript app (App Router), Tailwind setup.

Integrate next-pwa with auto-update, workbox runtime caching for HTML/JS/CSS/images/fonts.

Add manifest (name, short_name, theme_color #B8860B, background_color #ffffff, display standalone, start_url /, icons 192/512).

Add robots.txt, favicon, splash-safe meta tags.

Acceptance: next build passes; PWA install prompt works; offline loads previously visited pages.

Size: large; Priority: high.


IndexedDB service utilities


Implement services/db.ts with helpers for two object stores: stores (single record: name, address, phone, admin, brandColor, logoBase64, ts) and invoice_drafts (customer, address, date, status, items[], shipping, notes, invoice_number, ts).

Handle init, get, put, clear; catch errors and provide in-memory fallback with console warning.

Acceptance: CRUD works in modern browsers; failures fall back gracefully.

Size: medium; Priority: high.


Store Settings UI (modal)


Modal accessible from header gear icon.

Inputs: store name, address, phone, admin name, brand color (with default #B8860B), logo upload (base64). Persist to stores.

Show Install PWA button when beforeinstallprompt available.

Acceptance: Save/reload restores settings; PWA install button appears when eligible.

Size: medium; Priority: high.


Invoice form + autosave


Fields: customer name, address, status dropdown [Distributor, Reseller, Customer], date (default today), notes, shipping (number), invoice number (prefill INV-DDMMYY-001, keep draft value if present).

Items editor: add/remove rows; fields name, price (number), qty (number, default 0). Numeric-only handling and id-ID currency formatting utilities.

Autosave draft to invoice_drafts with 1s debounce; on load, restore draft except date resets to today.

Acceptance: Draft persists across reloads; items management works; computed fields memoized.

Size: large; Priority: high.


Real-time calculation + validation


Derived: subtotal = sum(price*qty); total = subtotal + shipping. Update live in form and preview.

Validation on clicking Preview/Download: require customer name, at least one item with non-empty name, price > 0, qty > 0; show inline errors.

Acceptance: Prevent preview when invalid; calculations correct for edge cases (zero shipping, multiple items).

Size: medium; Priority: high.


Invoice preview + PDF export


Full-width modal preview using brand color for title/borders/total/signature accents; include store logo if provided (else blank).

Always render watermark text "[LUNAS]" under total section.

Integrate react-to-print to trigger system print dialog; file name Invoice_[NamaPembeli]_DDMMYY.pdf.

Acceptance: Preview matches design; PDF prints correctly; watermark visible; brand color applied.

Size: medium; Priority: high.


Accessibility/responsiveness/UX polish


Tailwind responsive layout for mobile-first; keyboard navigable form and modal; ensure brand color maintains contrast against white (min guidance or class variants).

Acceptance: Works on common mobile/desktop sizes; basic keyboard-only flow usable.

Size: small; Priority: medium.


QA scripts and docs


Add basic lint/tsconfig rules, npm scripts (dev, build, lint), and a README with setup/run steps and browser support notes.

Acceptance: pnpm|npm run build clean; README includes PWA/install instructions and offline testing notes.

Size: small; Priority: low.


Cross-cutting constraints:



Locale: Indonesian (id-ID) for currency/formatting; all default copy in Bahasa Indonesia.

Security: local-only data; no network persistence.

Performance: interactions <200ms on mid devices.


Provide draft tasks scoped to repo simple-invoice with clear titles and descriptions, sizes, and priorities.
