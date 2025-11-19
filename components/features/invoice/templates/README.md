# Invoice Templates

This folder contains all invoice templates for the application.

## Current Templates

### 1. Classic Template (`classic-template.tsx`)
- Professional layout with header, logo, and signature
- Itemized table with quantities and prices
- Shipping cost and totals
- Payment method and contact info in footer

## Adding New Templates

### Step 1: Create Template File

Create a new file in this folder (e.g., `modern-template.tsx`):

```tsx
"use client";

import React from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceTemplateProps } from "../types";

export function ModernInvoiceTemplate({
  invoice,
  storeSettings,
  preview = false,
}: InvoiceTemplateProps) {
  // Your template JSX here
  return (
    <div
      style={
        preview
          ? { /* preview styles */ }
          : { position: "fixed", left: "-9999px", top: 0 }
      }
    >
      <div id="invoice-content" style={{ /* your styles */ }}>
        {/* Your invoice layout */}
      </div>
    </div>
  );
}
```

### Step 2: Export in Index

Add your template to `index.ts`:

```ts
export { ModernInvoiceTemplate } from './modern-template';

export const INVOICE_TEMPLATES = {
  classic: 'ClassicInvoiceTemplate',
  modern: 'ModernInvoiceTemplate', // Add here
} as const;
```

### Step 3: Use Template

Import and use in your component:

```tsx
import { ModernInvoiceTemplate } from "@/components/features/invoice/templates";

<ModernInvoiceTemplate
  invoice={invoice}
  storeSettings={storeSettings}
  preview={true}
/>
```

## Template Requirements

All templates MUST:

1. **Accept `InvoiceTemplateProps`**
   - `invoice`: Invoice data
   - `storeSettings`: Store configuration
   - `preview`: Boolean for preview mode

2. **Have `id="invoice-content"` on main container**
   - Required for JPEG generation

3. **Support preview mode**
   - `preview={false}`: Hidden (for JPEG generation)
   - `preview={true}`: Visible (for preview)

4. **Use inline styles**
   - Required for JPEG generation
   - No external CSS classes

5. **Be responsive to store settings**
   - Brand color
   - Logo
   - Signature
   - Payment method
   - etc.

## Template Ideas

Future templates to consider:

- **Modern**: Clean, minimalist design with bold typography
- **Minimal**: Ultra-simple, text-focused layout
- **Colorful**: Vibrant colors and modern gradients
- **Corporate**: Formal, traditional business style
- **Creative**: Unique layout with artistic elements
- **Compact**: Space-efficient for shorter invoices

## Best Practices

1. **Keep it simple**: Avoid complex layouts
2. **Test JPEG generation**: Ensure template renders correctly
3. **Use brand color**: Respect `storeSettings.brandColor`
4. **Handle missing data**: Gracefully handle null/undefined values
5. **Consistent spacing**: Use consistent padding/margins
6. **Readable fonts**: Use web-safe fonts (Helvetica, Arial)
7. **Print-friendly**: Design for A4 paper (794px width)

## File Structure

```
components/features/invoice/
├── templates/
│   ├── README.md              # This file
│   ├── index.ts               # Template exports
│   ├── classic-template.tsx   # Classic template
│   ├── modern-template.tsx    # Future template
│   └── minimal-template.tsx   # Future template
├── types.ts                   # Shared types
└── ...
```
