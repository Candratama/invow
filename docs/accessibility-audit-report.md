# Accessibility Audit Report

Generated: 2025-11-21T09:27:20.337Z

## Summary

- Total Tests: 29
- ✅ Passed: 13 (44.8%)
- ❌ Failed: 2 (6.9%)
- ⚠️ Warnings: 14 (48.3%)

## Hardcoded Font Sizes

### ❌ File: components/features/invoice/invoice-preview.tsx

**Status:** FAIL

**Message:** Found 15 hardcoded font size(s): fontSize: "12pt", fontSize: "19pt", fontSize: "11pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "12pt", fontSize: "10pt", fontSize: "10pt", fontSize: "38pt", fontSize: "10pt"

**Requirement:** 3.4

### ❌ File: components/features/invoice/templates/classic-template.tsx

**Status:** FAIL

**Message:** Found 18 hardcoded font size(s): fontSize: "12pt", fontSize: "19pt", fontSize: "11pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "10pt", fontSize: "11pt", fontSize: "10pt", fontSize: "10pt", fontSize: "12pt", fontSize: "12pt", fontSize: "12pt", fontSize: "10pt", fontSize: "10pt", fontSize: "11pt", fontSize: "10pt"

**Requirement:** 3.4

## Heading Hierarchy

### ✅ File: app/account/page.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1, 2

**Requirement:** 6.1

### ✅ File: app/dashboard/account/page.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1, 2

**Requirement:** 6.1

### ✅ File: app/dashboard/forgot-password/page.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1, 2

**Requirement:** 6.1

### ✅ File: app/dashboard/login/page.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1

**Requirement:** 6.1

### ✅ File: app/dashboard/page.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1, 2

**Requirement:** 6.1

### ✅ File: app/dashboard/signup/page.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1, 2

**Requirement:** 6.1

### ✅ File: app/not-found.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1

**Requirement:** 6.1

### ⚠️ File: components/features/dashboard/revenue-cards.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 3

**Requirement:** 6.1

### ⚠️ File: components/features/invoice/invoice-form.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 3

**Requirement:** 6.1

### ⚠️ File: components/features/invoice/item-row.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 4

**Requirement:** 6.1

### ⚠️ File: components/features/payment/notification.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 3

**Requirement:** 6.1

### ⚠️ File: components/features/settings/contact-person-tab.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2, 4

**Requirement:** 6.1

### ⚠️ File: components/features/settings/user-preferences-tab.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2

**Requirement:** 6.1

### ⚠️ File: components/features/subscription/status.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 3

**Requirement:** 6.1

### ⚠️ File: components/landing-page/benefits-section.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2

**Requirement:** 6.1

### ⚠️ File: components/landing-page/cta-section.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2

**Requirement:** 6.1

### ⚠️ File: components/landing-page/feature-card.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 3

**Requirement:** 6.1

### ⚠️ File: components/landing-page/features-section.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2

**Requirement:** 6.1

### ✅ File: components/landing-page/hero-section.tsx

**Status:** PASS

**Message:** Proper heading hierarchy maintained: 1

**Requirement:** 6.1

### ⚠️ File: components/landing-page/pricing-card.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 3

**Requirement:** 6.1

### ⚠️ File: components/landing-page/pricing-section.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2

**Requirement:** 6.1

### ⚠️ File: components/ui/bottom-sheet.tsx

**Status:** WARNING

**Message:** File contains headings but no h1. Levels found: 2

**Requirement:** 6.1

## Minimum Font Size

### ✅ All files

**Status:** PASS

**Message:** All text meets minimum 12px (0.75rem) requirement. Smallest size used is text-xs.

**Requirement:** 6.5

## Responsive Typography

### ✅ All files

**Status:** PASS

**Message:** Found 90 responsive typography instances across 26 files.

**Requirement:** 4.1, 4.2, 4.3

## Relative Units

### ✅ Tailwind Config

**Status:** PASS

**Message:** Tailwind configuration uses rem units for font sizes, supporting browser zoom up to 200%.

**Requirement:** 6.3, 6.4

## Touch Targets

### ✅ Interactive Elements

**Status:** PASS

**Message:** All 2 checked interactive elements have adequate padding for 44x44px touch targets.

**Requirement:** 4.5

## Typography Utilities

### ✅ Typography Module

**Status:** PASS

**Message:** Typography utility module exists and exports reusable constants.

**Requirement:** 3.3, 8.2

