# Typography System Documentation

## Overview

This document provides comprehensive guidelines for using the typography system in the invoice application. The system is based on the golden ratio (φ = 1.618) and integrates seamlessly with Tailwind CSS.

## Type Scale Reference

### Complete Type Scale

| Level | Name | rem | px | Tailwind Class | Line Height | Use Case |
|-------|------|-----|----|--------------------|-------------|----------|
| -2 | Extra Small | 0.75rem | 12px | `text-xs` | 1.5 | Metadata, captions, legal text |
| -1 | Small | 0.875rem | 14px | `text-sm` | 1.5 | Secondary text, form labels |
| 0 | Base | 1rem | 16px | `text-base` | 1.618 | Body text, form inputs |
| 1 | Large | 1.125rem | 18px | `text-lg` | 1.618 | Emphasized body text |
| 2 | Extra Large | 1.25rem | 20px | `text-xl` | 1.4 | Small headings, card titles |
| 3 | 2X Large | 1.5rem | 24px | `text-2xl` | 1.4 | Section headings (h3) |
| 4 | 3X Large | 1.875rem | 30px | `text-3xl` | 1.2 | Page headings (h2) |
| 5 | 4X Large | 2.25rem | 36px | `text-4xl` | 1.2 | Major headings (h1) |

### Font Weights

| Weight | Value | Tailwind Class | Use Case |
|--------|-------|----------------|----------|
| Normal | 400 | `font-normal` | Body text, descriptions |
| Medium | 500 | `font-medium` | Labels, emphasized text, buttons |
| Semibold | 600 | `font-semibold` | Subheadings, important information |
| Bold | 700 | `font-bold` | Primary headings, strong emphasis |

## Usage Guidelines

### Headings

Use semantic HTML heading tags with appropriate typography classes:

```tsx
// H1 - Page Title
<h1 className="text-3xl lg:text-4xl font-bold leading-tight">
  Dashboard
</h1>

// H2 - Section Heading
<h2 className="text-2xl lg:text-3xl font-bold leading-tight">
  Recent Invoices
</h2>

// H3 - Subsection Heading
<h3 className="text-xl lg:text-2xl font-semibold leading-snug">
  Invoice Details
</h3>

// H4 - Card/Component Heading
<h4 className="text-lg lg:text-xl font-semibold leading-snug">
  Customer Information
</h4>
```

### Body Text

```tsx
// Standard body text
<p className="text-base leading-relaxed">
  This is standard body text with optimal line height for readability.
</p>

// Large body text (for emphasis)
<p className="text-lg leading-relaxed">
  This is emphasized body text, slightly larger than standard.
</p>

// Small body text (for secondary information)
<p className="text-sm leading-normal text-gray-600">
  This is secondary information in a smaller size.
</p>
```

### UI Components

#### Buttons

```tsx
// Primary button (mobile and desktop)
<button className="text-sm lg:text-base font-medium">
  Create Invoice
</button>

// Secondary button
<button className="text-sm font-medium">
  Cancel
</button>

// Small button
<button className="text-xs font-medium">
  Edit
</button>
```

#### Form Elements

```tsx
// Form label
<label className="text-sm font-medium text-gray-700">
  Customer Name
</label>

// Input field
<input className="text-base" />

// Helper text
<span className="text-xs text-gray-500">
  Enter the customer's full name
</span>

// Error message
<span className="text-xs text-red-600">
  This field is required
</span>
```

#### Cards

```tsx
// Card title
<h3 className="text-base font-bold leading-snug">
  Invoice #1234
</h3>

// Card subtitle
<p className="text-sm text-gray-600">
  Customer Name
</p>

// Card metadata
<span className="text-xs text-gray-500">
  Created: Jan 15, 2024
</span>
```

#### Tables

```tsx
// Table header
<th className="text-sm font-medium text-gray-700">
  Invoice Number
</th>

// Table body
<td className="text-sm">
  #1234
</td>

// Table metadata
<td className="text-xs text-gray-500">
  2 days ago
</td>
```

## Responsive Typography Examples

### Mobile-First Approach

Always start with mobile sizing and scale up for larger screens:

```tsx
// Page heading - scales from 30px to 36px
<h1 className="text-3xl lg:text-4xl font-bold">
  Welcome Back
</h1>

// Section heading - scales from 24px to 30px
<h2 className="text-2xl lg:text-3xl font-bold">
  Your Invoices
</h2>

// Card title - scales from 20px to 22px
<h3 className="text-xl lg:text-2xl font-semibold">
  Revenue Summary
</h3>

// Navigation items - scales from 14px to 16px
<a className="text-sm lg:text-base font-medium">
  Dashboard
</a>
```

### Breakpoint Reference

| Breakpoint | Screen Size | Scale Factor | Example |
|------------|-------------|--------------|---------|
| Mobile (default) | < 640px | 1× | `text-base` = 16px |
| Tablet | 640px - 1024px | 1.125× | Use `md:` prefix if needed |
| Desktop | > 1024px | 1.25× | `lg:text-lg` = 20px |

### Common Responsive Patterns

```tsx
// Dashboard welcome message
<h2 className="text-base lg:text-lg font-semibold">
  Welcome, John!
</h2>

// Revenue card value
<p className="text-2xl lg:text-3xl font-bold">
  $12,450
</p>

// Button text
<button className="text-sm lg:text-base font-medium">
  View Details
</button>

// Form label (stays consistent)
<label className="text-sm font-medium">
  Email Address
</label>
```

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

#### 1. Contrast Ratios

Ensure proper contrast between text and background:

- **Normal text** (< 18px): Minimum 4.5:1 contrast ratio
- **Large text** (≥ 18px or ≥ 14px bold): Minimum 3:1 contrast ratio

```tsx
// Good: Dark text on light background
<p className="text-gray-900 bg-white">High contrast text</p>

// Good: Light text on dark background
<p className="text-white bg-gray-900">High contrast text</p>

// Avoid: Low contrast combinations
<p className="text-gray-400 bg-gray-300">Low contrast - avoid!</p>
```

#### 2. Semantic Heading Hierarchy

Always use proper heading order without skipping levels:

```tsx
// ✅ Correct hierarchy
<h1>Page Title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>
    <h3>Another Subsection</h3>
  <h2>Another Section</h2>

// ❌ Incorrect - skips h2
<h1>Page Title</h1>
  <h3>Subsection</h3>
```

#### 3. Minimum Font Sizes

Never use text smaller than 12px (0.75rem) except for legal disclaimers:

```tsx
// ✅ Acceptable minimum
<span className="text-xs">Metadata</span> {/* 12px */}

// ❌ Too small - avoid
<span style={{ fontSize: '10px' }}>Too small</span>
```

#### 4. Zoom Support

Use relative units (rem) to support browser zoom up to 200%:

```tsx
// ✅ Good: Uses rem-based Tailwind classes
<p className="text-base">Zoomable text</p>

// ❌ Bad: Fixed pixel sizes
<p style={{ fontSize: '16px' }}>Not zoomable</p>
```

#### 5. Touch Target Sizes

Ensure interactive text elements meet minimum 44×44px touch targets on mobile:

```tsx
// ✅ Good: Adequate padding for touch
<button className="text-sm font-medium px-4 py-3">
  Tap Me
</button>

// ❌ Bad: Too small for touch
<button className="text-xs p-1">
  Too Small
</button>
```

### Screen Reader Considerations

```tsx
// Use semantic HTML
<h1>Dashboard</h1> {/* Screen reader announces as heading level 1 */}

// Provide context for icon-only buttons
<button aria-label="Delete invoice">
  <TrashIcon className="text-sm" />
</button>

// Use proper label associations
<label htmlFor="email" className="text-sm font-medium">
  Email
</label>
<input id="email" className="text-base" />
```

## Component-Specific Guidelines

### Invoice Cards

```tsx
<div className="space-y-2">
  {/* Customer name - primary information */}
  <h3 className="text-base font-bold leading-snug">
    Acme Corporation
  </h3>
  
  {/* Invoice number - secondary */}
  <p className="text-sm text-gray-600">
    Invoice #INV-2024-001
  </p>
  
  {/* Metadata - tertiary */}
  <div className="flex gap-4 text-xs text-gray-500">
    <span>Jan 15, 2024</span>
    <span>3 items</span>
  </div>
  
  {/* Amount - emphasized */}
  <p className="text-sm font-medium text-gray-900">
    $1,250.00
  </p>
</div>
```

### Dashboard Components

```tsx
{/* Revenue card */}
<div className="space-y-2">
  <h3 className="text-base lg:text-lg font-semibold">
    Total Revenue
  </h3>
  <p className="text-2xl lg:text-3xl font-bold">
    $45,231.89
  </p>
  <p className="text-sm text-gray-600">
    +20.1% from last month
  </p>
</div>

{/* Welcome message */}
<h2 className="text-base lg:text-lg font-semibold">
  Welcome back, John!
</h2>
```

### Navigation

```tsx
{/* Page title in header */}
<h1 className="text-lg lg:text-xl font-semibold">
  Dashboard
</h1>

{/* Navigation links */}
<nav className="space-x-4">
  <a className="text-sm lg:text-base font-medium">
    Invoices
  </a>
  <a className="text-sm lg:text-base font-medium">
    Settings
  </a>
</nav>

{/* Tab menu */}
<div className="flex gap-2">
  <button className="text-xs lg:text-sm font-medium">
    Overview
  </button>
  <button className="text-xs lg:text-sm font-medium">
    Details
  </button>
</div>
```

## Best Practices

### Do's ✅

1. **Use Tailwind utility classes** instead of custom CSS
2. **Start mobile-first** and scale up with `lg:` prefix
3. **Use semantic HTML** (h1, h2, h3, etc.)
4. **Maintain heading hierarchy** (don't skip levels)
5. **Use relative units** (rem-based classes)
6. **Test with zoom** up to 200%
7. **Check contrast ratios** for all text
8. **Provide adequate touch targets** (44×44px minimum)

### Don'ts ❌

1. **Don't use hardcoded font sizes** (`style={{ fontSize: '16px' }}`)
2. **Don't skip heading levels** (h1 → h3)
3. **Don't use text smaller than 12px** (except legal text)
4. **Don't ignore responsive scaling** on larger screens
5. **Don't use low contrast** text colors
6. **Don't use absolute units** (px) in custom CSS
7. **Don't create custom font sizes** outside the scale
8. **Don't forget line height** (use Tailwind's leading classes)

## Typography Utilities

The application provides a `typography` utility object for common patterns:

```typescript
import { typography } from '@/lib/utils/typography';

// Usage in components
<h1 className={typography.h1}>Page Title</h1>
<h2 className={typography.h2}>Section Heading</h2>
<p className={typography.body}>Body text</p>
<label className={typography.label}>Form Label</label>
```

Available utilities:
- `typography.h1` through `typography.h4` - Heading styles
- `typography.body` - Standard body text
- `typography.bodyLarge` - Emphasized body text
- `typography.bodySmall` - Secondary body text
- `typography.label` - Form labels
- `typography.caption` - Captions and metadata
- `typography.button` - Button text
- `typography.buttonSmall` - Small button text

## Testing Checklist

Use this checklist when implementing or reviewing typography:

### Visual Testing
- [ ] Text is readable on mobile (< 640px)
- [ ] Text scales appropriately on desktop (> 1024px)
- [ ] Visual hierarchy is clear (headings stand out)
- [ ] Spacing feels balanced and consistent
- [ ] No text appears too small or too large

### Accessibility Testing
- [ ] All text meets WCAG AA contrast ratios
- [ ] Heading hierarchy is semantic (h1 → h2 → h3)
- [ ] Text can be zoomed to 200% without breaking
- [ ] Touch targets are minimum 44×44px on mobile
- [ ] Screen reader announces headings correctly

### Code Quality
- [ ] No hardcoded font sizes in styles
- [ ] Using Tailwind utility classes
- [ ] Responsive classes added where needed (`lg:`)
- [ ] Semantic HTML tags used (h1, h2, p, etc.)
- [ ] Line height classes applied appropriately

## Common Issues and Solutions

### Issue: Text too small on mobile
**Solution:** Ensure base size is at least `text-sm` (14px) for body text and `text-base` (16px) for inputs.

### Issue: Headings don't stand out
**Solution:** Use proper font weight (`font-bold` or `font-semibold`) and ensure size difference between heading levels.

### Issue: Text breaks layout at 200% zoom
**Solution:** Use Tailwind's rem-based classes instead of fixed pixel sizes.

### Issue: Low contrast warnings
**Solution:** Use darker text colors (e.g., `text-gray-900` instead of `text-gray-500`) or adjust background colors.

### Issue: Inconsistent spacing
**Solution:** Use Tailwind's spacing utilities (`space-y-4`, `gap-2`) based on the golden ratio.

## Resources

- [Tailwind CSS Typography Documentation](https://tailwindcss.com/docs/font-size)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Golden Ratio Typography Calculator](https://grtcalculator.com/)

## Component-Specific Typography Reference

This section provides detailed typography guidelines for each component type in the application, including before/after migration examples.

### Invoice Components

#### Invoice Card
The invoice card displays summary information about an invoice in a list or grid view.

**Typography Hierarchy:**
```tsx
<div className="space-y-2">
  {/* Primary: Customer name */}
  <h3 className="text-base font-bold leading-snug">
    Acme Corporation
  </h3>
  
  {/* Secondary: Invoice number */}
  <p className="text-sm text-gray-600">
    Invoice #INV-2024-001
  </p>
  
  {/* Tertiary: Metadata */}
  <div className="flex gap-4 text-xs text-gray-500">
    <span>Jan 15, 2024</span>
    <span>3 items</span>
  </div>
  
  {/* Emphasized: Amount */}
  <p className="text-sm font-medium text-gray-900">
    $1,250.00
  </p>
</div>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent sizing
<h3 className="text-lg font-bold">Acme Corporation</h3>
<p className="text-base">Invoice #INV-2024-001</p>
<span style={{ fontSize: '11px' }}>Jan 15, 2024</span>

// ✅ After: Consistent golden ratio scale
<h3 className="text-base font-bold leading-snug">Acme Corporation</h3>
<p className="text-sm text-gray-600">Invoice #INV-2024-001</p>
<span className="text-xs text-gray-500">Jan 15, 2024</span>
```

#### Invoice Form
The invoice form allows users to create and edit invoices.

**Typography Hierarchy:**
```tsx
<form className="space-y-6">
  {/* Section heading */}
  <h2 className="text-lg lg:text-xl font-semibold">
    Invoice Details
  </h2>
  
  {/* Field label */}
  <label className="text-sm font-medium text-gray-700">
    Customer Name
  </label>
  
  {/* Input field */}
  <input className="text-base" placeholder="Enter customer name" />
  
  {/* Helper text */}
  <p className="text-xs text-gray-500">
    Enter the full legal name of the customer
  </p>
  
  {/* Error message */}
  <p className="text-xs text-red-600">
    This field is required
  </p>
</form>
```

**Before/After Migration:**
```tsx
// ❌ Before: Mixed sizing approaches
<h2 style={{ fontSize: '20px' }}>Invoice Details</h2>
<label className="text-base font-semibold">Customer Name</label>
<input className="text-sm" />

// ✅ After: Consistent system with responsive scaling
<h2 className="text-lg lg:text-xl font-semibold">Invoice Details</h2>
<label className="text-sm font-medium text-gray-700">Customer Name</label>
<input className="text-base" />
```

#### Invoice Preview/Template
The invoice preview shows the final rendered invoice for printing or export.

**Typography Hierarchy:**
```tsx
<div className="space-y-6">
  {/* Invoice title */}
  <h1 className="text-2xl lg:text-3xl font-bold">
    INVOICE
  </h1>
  
  {/* Customer information */}
  <div className="text-base">
    <p className="font-semibold">Bill To:</p>
    <p>Acme Corporation</p>
    <p>123 Business St</p>
  </div>
  
  {/* Item descriptions */}
  <table>
    <thead>
      <tr className="text-sm font-medium">
        <th>Description</th>
        <th>Quantity</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody className="text-sm">
      <tr>
        <td>Web Design Services</td>
        <td>1</td>
        <td>$1,000.00</td>
      </tr>
    </tbody>
  </table>
  
  {/* Totals */}
  <div className="text-base lg:text-lg font-semibold">
    <p>Total: $1,250.00</p>
  </div>
</div>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent print sizing
<h1 className="text-3xl font-bold">INVOICE</h1>
<p className="text-lg">Bill To:</p>
<td className="text-base">Web Design Services</td>

// ✅ After: Optimized for print and screen
<h1 className="text-2xl lg:text-3xl font-bold">INVOICE</h1>
<p className="text-base font-semibold">Bill To:</p>
<td className="text-sm">Web Design Services</td>
```

### Dashboard Components

#### Revenue Cards
Revenue cards display key metrics and statistics.

**Typography Hierarchy:**
```tsx
<div className="space-y-2">
  {/* Card heading */}
  <h3 className="text-base lg:text-lg font-semibold">
    Total Revenue
  </h3>
  
  {/* Primary value */}
  <p className="text-2xl lg:text-3xl font-bold">
    $45,231.89
  </p>
  
  {/* Secondary information */}
  <p className="text-sm text-gray-600">
    +20.1% from last month
  </p>
  
  {/* Metadata */}
  <p className="text-xs text-gray-500">
    Last updated: 2 hours ago
  </p>
</div>
```

**Before/After Migration:**
```tsx
// ❌ Before: No responsive scaling
<h3 className="text-lg font-semibold">Total Revenue</h3>
<p className="text-3xl font-bold">$45,231.89</p>
<p className="text-sm">+20.1% from last month</p>

// ✅ After: Responsive scaling for better desktop experience
<h3 className="text-base lg:text-lg font-semibold">Total Revenue</h3>
<p className="text-2xl lg:text-3xl font-bold">$45,231.89</p>
<p className="text-sm text-gray-600">+20.1% from last month</p>
```

#### Welcome Message
The welcome message greets users on the dashboard.

**Typography:**
```tsx
<h2 className="text-base lg:text-lg font-semibold">
  Welcome back, John!
</h2>
```

**Before/After Migration:**
```tsx
// ❌ Before: Too large on mobile
<h2 className="text-xl font-semibold">Welcome back, John!</h2>

// ✅ After: Appropriate sizing for mobile and desktop
<h2 className="text-base lg:text-lg font-semibold">Welcome back, John!</h2>
```

### Navigation Components

#### Page Header
The page header displays the current page title.

**Typography:**
```tsx
<header>
  <h1 className="text-lg lg:text-xl font-semibold">
    Dashboard
  </h1>
</header>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent with other headings
<h1 className="text-2xl font-bold">Dashboard</h1>

// ✅ After: Consistent header sizing
<h1 className="text-lg lg:text-xl font-semibold">Dashboard</h1>
```

#### Navigation Links
Navigation links in the main menu.

**Typography:**
```tsx
<nav className="space-x-4">
  <a className="text-sm lg:text-base font-medium">
    Invoices
  </a>
  <a className="text-sm lg:text-base font-medium">
    Settings
  </a>
</nav>
```

**Before/After Migration:**
```tsx
// ❌ Before: No responsive scaling
<a className="text-base font-medium">Invoices</a>

// ✅ After: Scales up on desktop
<a className="text-sm lg:text-base font-medium">Invoices</a>
```

#### Tab Menu
Tab navigation for switching between views.

**Typography:**
```tsx
<div className="flex gap-2">
  <button className="text-xs lg:text-sm font-medium">
    Overview
  </button>
  <button className="text-xs lg:text-sm font-medium">
    Details
  </button>
</div>
```

**Before/After Migration:**
```tsx
// ❌ Before: Too small on desktop
<button className="text-xs font-medium">Overview</button>

// ✅ After: Better readability on larger screens
<button className="text-xs lg:text-sm font-medium">Overview</button>
```

### Settings Components

#### Section Headings
Main section headings in settings pages.

**Typography:**
```tsx
<h2 className="text-lg lg:text-xl font-semibold">
  Store Settings
</h2>
```

#### Subsection Headings
Subsection headings within settings.

**Typography:**
```tsx
<h3 className="text-base lg:text-lg font-medium">
  Business Information
</h3>
```

#### Description Text
Explanatory text for settings options.

**Typography:**
```tsx
<p className="text-sm text-gray-600">
  Configure your store's basic information and contact details
</p>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent hierarchy
<h2 className="text-xl font-bold">Store Settings</h2>
<h3 className="text-lg font-semibold">Business Information</h3>
<p className="text-base">Configure your store's basic information</p>

// ✅ After: Clear hierarchy with responsive scaling
<h2 className="text-lg lg:text-xl font-semibold">Store Settings</h2>
<h3 className="text-base lg:text-lg font-medium">Business Information</h3>
<p className="text-sm text-gray-600">Configure your store's basic information</p>
```

### Button Components

#### Primary Button
Main call-to-action buttons.

**Typography:**
```tsx
<button className="text-sm lg:text-base font-medium">
  Create Invoice
</button>
```

#### Secondary Button
Secondary action buttons.

**Typography:**
```tsx
<button className="text-sm font-medium">
  Cancel
</button>
```

#### Small Button
Compact buttons for inline actions.

**Typography:**
```tsx
<button className="text-xs font-medium">
  Edit
</button>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent button sizing
<button className="text-base font-semibold">Create Invoice</button>
<button className="text-sm">Cancel</button>

// ✅ After: Consistent sizing with responsive scaling
<button className="text-sm lg:text-base font-medium">Create Invoice</button>
<button className="text-sm font-medium">Cancel</button>
```

### Form Components

#### Form Labels
Labels for form inputs.

**Typography:**
```tsx
<label className="text-sm font-medium text-gray-700">
  Email Address
</label>
```

#### Input Fields
Text input fields.

**Typography:**
```tsx
<input className="text-base" />
```

#### Helper Text
Helpful information below inputs.

**Typography:**
```tsx
<p className="text-xs text-gray-500">
  We'll never share your email with anyone else
</p>
```

#### Error Messages
Validation error messages.

**Typography:**
```tsx
<p className="text-xs text-red-600">
  Please enter a valid email address
</p>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent form typography
<label className="text-base font-bold">Email Address</label>
<input className="text-sm" />
<p className="text-xs">We'll never share your email</p>
<p style={{ fontSize: '11px', color: 'red' }}>Invalid email</p>

// ✅ After: Consistent form hierarchy
<label className="text-sm font-medium text-gray-700">Email Address</label>
<input className="text-base" />
<p className="text-xs text-gray-500">We'll never share your email</p>
<p className="text-xs text-red-600">Invalid email</p>
```

### Table Components

#### Table Headers
Column headers in data tables.

**Typography:**
```tsx
<th className="text-sm font-medium text-gray-700">
  Invoice Number
</th>
```

#### Table Body
Data cells in tables.

**Typography:**
```tsx
<td className="text-sm">
  #INV-2024-001
</td>
```

#### Table Metadata
Secondary information in tables.

**Typography:**
```tsx
<td className="text-xs text-gray-500">
  2 days ago
</td>
```

**Before/After Migration:**
```tsx
// ❌ Before: Inconsistent table sizing
<th className="text-base font-bold">Invoice Number</th>
<td className="text-base">#INV-2024-001</td>
<td className="text-xs">2 days ago</td>

// ✅ After: Consistent table typography
<th className="text-sm font-medium text-gray-700">Invoice Number</th>
<td className="text-sm">#INV-2024-001</td>
<td className="text-xs text-gray-500">2 days ago</td>
```

### Landing Page Components

#### Hero Section
Main hero heading and subheading.

**Typography:**
```tsx
<div>
  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold">
    Create Beautiful Invoices
  </h1>
  <p className="text-base sm:text-lg text-gray-600">
    Professional invoicing made simple for small businesses
  </p>
</div>
```

#### Feature Cards
Feature descriptions on landing page.

**Typography:**
```tsx
<div>
  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">
    Fast & Easy
  </h3>
  <p className="text-sm lg:text-base text-gray-600">
    Create invoices in seconds, not hours
  </p>
</div>
```

#### Pricing Cards
Pricing tier information.

**Typography:**
```tsx
<div>
  <h3 className="text-xl lg:text-2xl font-semibold">
    Professional
  </h3>
  <p className="text-sm lg:text-base text-gray-600">
    For growing businesses
  </p>
  <span className="text-2xl lg:text-3xl font-bold">
    $29
  </span>
  <span className="text-sm lg:text-base text-gray-600">
    /month
  </span>
</div>
```

**Before/After Migration:**
```tsx
// ❌ Before: No responsive scaling
<h1 className="text-5xl font-bold">Create Beautiful Invoices</h1>
<h3 className="text-2xl font-semibold">Fast & Easy</h3>
<span className="text-3xl font-bold">$29</span>

// ✅ After: Progressive enhancement for larger screens
<h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold">
  Create Beautiful Invoices
</h1>
<h3 className="text-xl lg:text-2xl font-semibold">Fast & Easy</h3>
<span className="text-2xl lg:text-3xl font-bold">$29</span>
```

## Migration Guide for New Components

When creating new components, follow this step-by-step guide to ensure typography consistency.

### Step 1: Identify Component Type

Determine what type of component you're building:
- **Content component**: Displays information (cards, lists, tables)
- **Interactive component**: User interaction (buttons, forms, navigation)
- **Layout component**: Structural (headers, sections, containers)

### Step 2: Choose Appropriate Typography Scale

Refer to the component-specific guidelines above and select typography that matches similar components:

```tsx
// For a new card component, follow invoice card pattern
<div className="space-y-2">
  <h3 className="text-base font-bold leading-snug">Card Title</h3>
  <p className="text-sm text-gray-600">Subtitle</p>
  <span className="text-xs text-gray-500">Metadata</span>
</div>
```

### Step 3: Add Responsive Scaling

For components that will be viewed on desktop, add responsive classes:

```tsx
// Add lg: prefix for desktop scaling
<h2 className="text-lg lg:text-xl font-semibold">Section Heading</h2>
<p className="text-sm lg:text-base">Body text</p>
```

**When to add responsive scaling:**
- ✅ Headings (h1-h4)
- ✅ Large body text
- ✅ Navigation items
- ✅ Card titles
- ✅ Button text (primary buttons)
- ❌ Form labels (keep consistent)
- ❌ Input text (keep consistent)
- ❌ Small metadata text

### Step 4: Ensure Semantic HTML

Use proper HTML tags for accessibility:

```tsx
// ✅ Good: Semantic HTML
<h2 className="text-lg lg:text-xl font-semibold">Section Title</h2>
<p className="text-base">Body text</p>
<label className="text-sm font-medium">Form Label</label>

// ❌ Bad: Non-semantic
<div className="text-lg font-semibold">Section Title</div>
<span className="text-base">Body text</span>
<div className="text-sm font-medium">Form Label</div>
```

### Step 5: Test Accessibility

Run through the accessibility checklist:

```bash
# Check contrast ratios
npx tsx scripts/accessibility-audit.ts

# Test responsive behavior
npx tsx scripts/test-responsive-typography.ts

# Validate touch targets on mobile
npx tsx scripts/touch-target-validation.ts
```

### Step 6: Document Component Typography

Add your component to this documentation with:
1. Component description
2. Typography hierarchy example
3. Before/after comparison (if migrating)
4. Any special considerations

### Migration Checklist for Existing Components

When migrating an existing component to the typography system:

- [ ] **Audit current typography**
  - Identify all font sizes used
  - Note any hardcoded styles
  - Document current visual hierarchy

- [ ] **Map to new scale**
  - Choose appropriate classes from the type scale
  - Ensure hierarchy is maintained or improved
  - Add responsive classes where appropriate

- [ ] **Update component code**
  - Replace hardcoded sizes with Tailwind classes
  - Add semantic HTML tags if missing
  - Include proper line height classes

- [ ] **Test visual appearance**
  - Compare before/after screenshots
  - Test on mobile (< 640px)
  - Test on desktop (> 1024px)
  - Verify visual hierarchy is clear

- [ ] **Test accessibility**
  - Check contrast ratios (WCAG AA)
  - Verify heading hierarchy
  - Test with screen reader
  - Test zoom to 200%
  - Verify touch targets (44×44px minimum)

- [ ] **Update tests**
  - Update snapshot tests if needed
  - Add accessibility tests
  - Test responsive behavior

- [ ] **Document changes**
  - Add before/after example to this guide
  - Note any special considerations
  - Update component documentation

### Example Migration: Button Component

Here's a complete example of migrating a button component:

**Step 1: Audit current state**
```tsx
// Current implementation
<button style={{ fontSize: '14px', fontWeight: 600 }}>
  Click Me
</button>
```

**Step 2: Map to typography system**
- Font size: 14px → `text-sm`
- Font weight: 600 → `font-semibold` (but buttons use `font-medium`)
- Add responsive scaling for primary buttons

**Step 3: Implement new typography**
```tsx
// New implementation
<button className="text-sm lg:text-base font-medium">
  Click Me
</button>
```

**Step 4: Test and verify**
- ✅ Readable on mobile (14px)
- ✅ Scales up on desktop (16px)
- ✅ Maintains adequate touch target
- ✅ Consistent with other buttons

**Step 5: Document**
Add to component documentation with before/after example.

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Text appears too small on mobile

**Symptoms:**
- Text is hard to read on mobile devices
- Users complain about readability
- Text is smaller than 14px

**Solution:**
```tsx
// ❌ Problem: Text too small
<p className="text-xs">Important information</p>

// ✅ Solution: Use at least text-sm for body content
<p className="text-sm">Important information</p>

// Note: text-xs (12px) should only be used for metadata and captions
```

**Prevention:**
- Use `text-base` (16px) for primary body text
- Use `text-sm` (14px) for secondary text
- Reserve `text-xs` (12px) for metadata only

---

#### Issue 2: Headings don't stand out enough

**Symptoms:**
- Visual hierarchy is unclear
- Headings blend with body text
- Users can't scan content easily

**Solution:**
```tsx
// ❌ Problem: Insufficient contrast
<h2 className="text-base font-normal">Section Heading</h2>
<p className="text-base">Body text</p>

// ✅ Solution: Increase size and weight
<h2 className="text-lg lg:text-xl font-semibold">Section Heading</h2>
<p className="text-base">Body text</p>
```

**Prevention:**
- Use at least 2 steps difference between heading and body
- Use `font-semibold` or `font-bold` for headings
- Add proper spacing with `space-y-*` utilities

---

#### Issue 3: Text breaks layout at 200% zoom

**Symptoms:**
- Layout breaks when zooming
- Text overlaps other elements
- Horizontal scrolling appears

**Solution:**
```tsx
// ❌ Problem: Fixed pixel widths
<div style={{ width: '300px' }}>
  <p className="text-base">Long text content...</p>
</div>

// ✅ Solution: Use flexible widths
<div className="max-w-prose">
  <p className="text-base">Long text content...</p>
</div>
```

**Prevention:**
- Use Tailwind's rem-based classes
- Avoid fixed pixel widths for text containers
- Test zoom levels up to 200%
- Use `max-w-prose` for long-form content

---

#### Issue 4: Low contrast warnings in accessibility audit

**Symptoms:**
- Accessibility audit fails
- Text is hard to read for some users
- Contrast ratio below 4.5:1

**Solution:**
```tsx
// ❌ Problem: Low contrast
<p className="text-gray-400 bg-white">Important text</p>

// ✅ Solution: Use darker text colors
<p className="text-gray-900 bg-white">Important text</p>

// For secondary text, use gray-600 minimum
<p className="text-gray-600 bg-white">Secondary text</p>
```

**Prevention:**
- Use `text-gray-900` for primary text
- Use `text-gray-600` or darker for secondary text
- Test with WebAIM Contrast Checker
- Run `npx tsx scripts/accessibility-audit.ts`

---

#### Issue 5: Inconsistent button sizing across the app

**Symptoms:**
- Buttons have different text sizes
- Some buttons too small to tap on mobile
- Visual inconsistency

**Solution:**
```tsx
// ❌ Problem: Inconsistent sizing
<button className="text-base">Button 1</button>
<button className="text-sm">Button 2</button>
<button style={{ fontSize: '15px' }}>Button 3</button>

// ✅ Solution: Use consistent button typography
<button className="text-sm lg:text-base font-medium">Primary Button</button>
<button className="text-sm font-medium">Secondary Button</button>
<button className="text-xs font-medium">Small Button</button>
```

**Prevention:**
- Use button typography utilities from `lib/utils/typography.ts`
- Follow component-specific guidelines
- Add adequate padding for touch targets

---

#### Issue 6: Responsive typography not working

**Symptoms:**
- Text doesn't scale up on desktop
- Same size on mobile and desktop
- `lg:` classes not applying

**Solution:**
```tsx
// ❌ Problem: Missing responsive classes
<h1 className="text-3xl font-bold">Page Title</h1>

// ✅ Solution: Add lg: prefix for desktop
<h1 className="text-3xl lg:text-4xl font-bold">Page Title</h1>

// Check Tailwind config includes lg breakpoint
// tailwind.config.js should have:
// screens: { lg: '1024px' }
```

**Prevention:**
- Always add `lg:` classes for headings and emphasized text
- Test on desktop viewport (> 1024px)
- Verify Tailwind config includes breakpoints

---

#### Issue 7: Form labels and inputs misaligned

**Symptoms:**
- Labels and inputs have different sizes
- Visual hierarchy unclear
- Form looks unbalanced

**Solution:**
```tsx
// ❌ Problem: Inconsistent form typography
<label className="text-base font-bold">Email</label>
<input className="text-sm" />

// ✅ Solution: Use standard form typography
<label className="text-sm font-medium text-gray-700">Email</label>
<input className="text-base" />
```

**Prevention:**
- Labels: `text-sm font-medium text-gray-700`
- Inputs: `text-base`
- Helper text: `text-xs text-gray-500`
- Error messages: `text-xs text-red-600`

---

#### Issue 8: Table data hard to read

**Symptoms:**
- Too much text in small space
- Columns misaligned
- Poor scannability

**Solution:**
```tsx
// ❌ Problem: Inconsistent table typography
<th className="text-base font-normal">Header</th>
<td className="text-xs">Data</td>

// ✅ Solution: Use consistent table typography
<th className="text-sm font-medium text-gray-700">Header</th>
<td className="text-sm">Data</td>
<td className="text-xs text-gray-500">Metadata</td>
```

**Prevention:**
- Headers: `text-sm font-medium text-gray-700`
- Body: `text-sm`
- Metadata: `text-xs text-gray-500`
- Add proper spacing with padding

---

#### Issue 9: Hardcoded font sizes detected in audit

**Symptoms:**
- Visual regression test fails
- Inconsistent with typography system
- Maintenance difficulties

**Solution:**
```tsx
// ❌ Problem: Hardcoded sizes
<p style={{ fontSize: '14px' }}>Text</p>
<div className="text-[15px]">Text</div>

// ✅ Solution: Use Tailwind classes
<p className="text-sm">Text</p>
<div className="text-base">Text</div>
```

**Prevention:**
- Never use inline `fontSize` styles
- Avoid arbitrary Tailwind values like `text-[15px]`
- Use only approved typography classes
- Run `npx tsx scripts/visual-regression-test.ts`

---

#### Issue 10: Touch targets too small on mobile

**Symptoms:**
- Hard to tap buttons/links on mobile
- Accessibility audit fails
- Poor mobile UX

**Solution:**
```tsx
// ❌ Problem: Insufficient padding
<button className="text-xs p-1">Tap Me</button>

// ✅ Solution: Add adequate padding
<button className="text-sm font-medium px-4 py-3">Tap Me</button>

// Ensure minimum 44×44px touch target
```

**Prevention:**
- Minimum padding: `px-4 py-3` for buttons
- Test on actual mobile devices
- Run `npx tsx scripts/touch-target-validation.ts`
- Use `text-sm` minimum for interactive elements

---

### Debugging Tools

#### Visual Regression Test
Detects hardcoded font sizes and typography inconsistencies:
```bash
npx tsx scripts/visual-regression-test.ts
```

#### Accessibility Audit
Checks contrast ratios and heading hierarchy:
```bash
npx tsx scripts/accessibility-audit.ts
```

#### Responsive Typography Test
Verifies responsive scaling across components:
```bash
npx tsx scripts/test-responsive-typography.ts
```

#### Touch Target Validation
Ensures adequate touch targets on mobile:
```bash
npx tsx scripts/touch-target-validation.ts
```

#### Cross-Browser Test
Tests typography rendering across browsers:
```bash
npx tsx scripts/cross-browser-test.ts
```

### Getting Help

If you encounter an issue not covered here:

1. **Check the design document**: `.kiro/specs/typography-system/design.md`
2. **Review requirements**: `.kiro/specs/typography-system/requirements.md`
3. **Search existing issues**: Check if others have encountered the same problem
4. **Run diagnostic tools**: Use the debugging tools listed above
5. **Ask the team**: Reach out with specific details and screenshots

### Reporting Issues

When reporting typography issues, include:
- Component name and file path
- Current typography classes used
- Expected vs actual appearance
- Screenshots (mobile and desktop)
- Browser and device information
- Accessibility audit results (if applicable)

## Support

For questions or issues with the typography system:
1. Check this documentation first
2. Review the design document at `.kiro/specs/typography-system/design.md`
3. Consult the requirements at `.kiro/specs/typography-system/requirements.md`
4. Reach out to the development team

---

**Last Updated:** November 21, 2025  
**Version:** 2.0


## Responsive Typography Implementation

### Breakpoint Strategy

The application uses a mobile-first responsive approach:
- **Mobile** (< 640px): Base scale (1×)
- **Tablet** (640px - 1024px): Scale × 1.125 (using `sm:` prefix for some components)
- **Desktop** (> 1024px): Scale × 1.25 (using `lg:` prefix)

### Implementation Status

As of November 21, 2025:
- **75% coverage** across all components with text
- All major user-facing components have responsive typography
- Low-level UI components (inputs, labels) intentionally remain static for consistency

### Responsive Patterns

#### Headings
```tsx
// H1 - Scales from 3xl to 4xl or 4xl to 5xl
<h1 className="text-3xl lg:text-4xl font-bold">Page Title</h1>
<h1 className="text-4xl lg:text-5xl font-bold">Hero Title</h1>

// H2 - Scales from 2xl to 3xl
<h2 className="text-2xl lg:text-3xl font-bold">Section Heading</h2>

// H3 - Scales from xl to 2xl
<h3 className="text-xl lg:text-2xl font-semibold">Subsection</h3>

// H4 - Scales from lg to xl
<h4 className="text-lg lg:text-xl font-semibold">Card Title</h4>
```

#### Body Text
```tsx
// Large body text
<p className="text-lg lg:text-xl">Emphasized content</p>

// Normal body text
<p className="text-base lg:text-lg">Standard paragraph</p>

// Small body text
<p className="text-sm lg:text-base">Secondary information</p>
```

#### UI Elements
```tsx
// Labels
<label className="text-sm lg:text-base font-medium">Field Label</label>

// Captions and metadata
<span className="text-xs lg:text-sm text-gray-500">Last updated</span>

// Helper text
<p className="text-xs lg:text-sm text-gray-600">Helper information</p>
```

### Testing

A comprehensive test suite is available:
- Run `npx tsx scripts/test-responsive-typography.ts` to check coverage
- See `docs/responsive-typography-test-results.md` for detailed results

### Components with Responsive Typography

All major components have been updated:
- ✅ Dashboard components (invoice cards, revenue cards)
- ✅ Invoice components (form, preview, templates)
- ✅ Settings components (all tabs)
- ✅ Landing page components (hero, features, pricing)
- ✅ Authentication pages (login, signup, forgot password)

### Accessibility Considerations

- Minimum 16px (1rem) base font size on mobile for readability
- Proper scaling maintains WCAG AA contrast ratios
- Text remains readable at 200% zoom
- Touch targets remain adequate (44×44px minimum)
- Semantic heading hierarchy preserved across breakpoints

### Performance

- No significant bundle size increase
- Tailwind JIT mode ensures only used classes are included
- Responsive classes add minimal overhead (~0.1KB per component)

## Visual Regression Testing

### Overview

The typography system includes automated visual regression testing to detect unintended changes and maintain consistency.

### Running Tests

```bash
# Run visual regression test
npx tsx scripts/visual-regression-test.ts
```

This will:
- Analyze all page and component files
- Extract typography class usage
- Detect hardcoded font sizes
- Generate a detailed report

### What Gets Checked

1. **No Hardcoded Font Sizes**
   - Detects inline styles like `fontSize: "14px"`
   - Detects arbitrary Tailwind values like `text-[14px]`
   - Ensures all sizing uses approved classes

2. **Typography Class Usage**
   - Tracks which typography classes are used where
   - Identifies patterns and frequency
   - Helps spot inconsistencies

3. **System Compliance**
   - Verifies only approved classes are used
   - Checks for deprecated patterns
   - Ensures responsive sizing is applied

### Baseline Report

A baseline report was generated on **2025-11-21** after completing the typography migration:
- **24 files analyzed**
- **281 typography usages documented**
- **0 hardcoded font sizes detected**
- **0 issues found**

See `docs/visual-regression-report.md` for the complete baseline.

### Documentation

- **Visual Regression Testing Guide**: `docs/visual-regression-testing-guide.md`
  - How to run tests
  - Interpreting results
  - Handling intentional changes
  - CI/CD integration

- **Migration Changes**: `docs/typography-migration-changes.md`
  - All intentional changes documented
  - Before/after comparisons
  - Component-specific changes
  - Testing results

### Maintenance

Run visual regression tests:
- Before committing typography changes
- During pull request reviews
- Quarterly as part of regular audits
- After adding new components

If issues are detected, review the report and either:
1. Fix the issue to comply with the system
2. Document as an intentional change if needed
