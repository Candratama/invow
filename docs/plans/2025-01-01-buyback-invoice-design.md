# Buyback Invoice Feature - Implementation Plan

## Overview
Add buyback invoice functionality to the existing invoice generator app, allowing users to create invoices for buying back items with price calculated per gram.

## Requirements Summary
- Reuse existing 8 invoice templates
- Add buyback price per gram setting in Settings > Invoice Settings
- Toggle in invoice form to switch between regular and buyback mode
- Fields: item name, gram weight, auto-calculated total
- Same image generation process (html2canvas)

## Implementation Steps

### Step 1: Database Migration (Production-Safe)
**Critical:** Must be backward compatible with existing production data

**File:** `supabase/migrations/20250101000000_add_buyback_price_to_preferences.sql`

```sql
-- Add buyback price per gram to user preferences
-- This is safe as it adds a new column with default value
ALTER TABLE user_preferences
ADD COLUMN buyback_price_per_gram DECIMAL(15,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.buyback_price_per_gram IS 'Price per gram for buyback invoices, stored in IDR';

-- Update TypeScript types
-- File: lib/types/database.types.ts (auto-generated from Supabase)
-- The types will be regenerated after migration
```

**Safety Check:**
- ✅ Existing invoices remain unchanged
- ✅ New column has default value (0)
- ✅ No data loss or corruption
- ✅ RLS policies apply to new column

---

### Step 2: Update TypeScript Types
**File:** `lib/types/invoice.ts`

Update InvoiceItem interface to support buyback fields:

```typescript
export interface InvoiceItem {
  id: string;
  name: string;

  // Regular invoice fields
  quantity?: number;
  unit_price?: number;
  subtotal?: number;

  // Buyback invoice fields
  is_buyback?: boolean;
  gram?: number;
  buyback_rate?: number; // Price per gram from settings
  total?: number; // Auto-calculated: gram × buyback_rate

  // Common fields
  created_at?: string;
  updated_at?: string;
}
```

---

### Step 3: Settings Integration
**Files to Modify:**
1. `components/features/settings/invoice-settings-tab.tsx`
2. `lib/db/services/user-preferences.service.ts`
3. `app/actions/preferences.ts`

**Changes:**
- Add `buyback_price_per_gram` field to InvoiceSettingsTab
- Add validation (positive number only)
- Add currency formatting (IDR)
- Update save/update functions to include new field

**UI Component:**
```typescript
// Add to InvoiceSettingsTab component
<div className="space-y-2">
  <label className="text-sm font-medium">Buyback Price per Gram</label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      Rp
    </span>
    <input
      type="number"
      step="0.01"
      min="0"
      className="pl-8"
      placeholder="0"
    />
  </div>
  <p className="text-xs text-muted-foreground">
    Price per gram for buyback invoices
  </p>
</div>
```

---

### Step 4: Invoice Form Enhancement
**Files to Modify:**
1. `components/features/invoice/invoice-form.tsx`
2. `lib/store.ts` (Zustand store)
3. `lib/hooks/use-invoice-form.ts` (if exists)

**Changes:**
- Add toggle switch for "Buyback Invoice" mode
- Add conditional field rendering (buyback vs regular)
- Add real-time total calculation
- Update form validation schema
- Add state management for buyback fields

**Form Structure:**
```
Invoice Form
├── Customer Selector
├── Buyback Toggle (NEW)
│   ├── Regular Mode
│   │   ├── Item Name
│   │   ├── Quantity
│   │   ├── Unit Price
│   │   └── Subtotal (auto-calc)
│   └── Buyback Mode
│       ├── Item Name
│       ├── Gram (with decimal support)
│       └── Total (auto-calc: gram × buyback_rate)
├── Add Item Button
└── Invoice Preview
```

---

### Step 5: Calculation Logic
**Files to Modify:**
1. `lib/utils/invoice-calculation.ts`
2. `lib/utils/currency.ts`

**Changes:**
- Extend `calculateItemTotal()` to handle buyback items
- Add `calculateBuybackTotal()` function
- Ensure backward compatibility with existing invoices

**Logic:**
```typescript
export function calculateItemTotal(item: InvoiceItem, buybackRate: number): number {
  if (item.is_buyback) {
    // Buyback: gram × buyback_rate
    return roundToTwoDecimals((item.gram || 0) * buybackRate);
  } else {
    // Regular: quantity × unit_price
    return roundToTwoDecimals((item.quantity || 0) * (item.unit_price || 0));
  }
}
```

---

### Step 6: Template Modifications
**Files to Modify:**
All 8 template files in `components/features/invoice/templates/`

**Changes:**
- Add conditional rendering for buyback items
- Display format: Name, Weight, Rate, Total
- Maintain existing styling and layout

**Template Example (Simple):**
```tsx
{item.is_buyback ? (
  <div>
    <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</div>
    <div style={{ fontSize: '12px', color: '#666' }}>
      Weight: {item.gram}g
    </div>
    <div style={{ fontSize: '12px', color: '#666' }}>
      Rate: {formatCurrency(item.buyback_rate || 0)}/gram
    </div>
    <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
      Total: {formatCurrency(item.total || 0)}
    </div>
  </div>
) : (
  // Existing regular item rendering
)}
```

---

### Step 7: Form Validation
**Files to Modify:**
1. Zod schemas in form components
2. Client-side validation logic

**Validation Rules:**
```typescript
// Regular mode
const regularItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

// Buyback mode
const buybackItemSchema = z.object({
  name: z.string().min(1),
  gram: z.number().positive(),
  is_buyback: z.literal(true),
});

// Conditional validation based on is_buyback flag
const invoiceItemSchema = z.discriminatedUnion('is_buyback', [
  regularItemSchema.extend({ is_buyback: z.literal(false) }),
  buybackItemSchema,
]);
```

---

### Step 8: Database Operations
**Files to Modify:**
1. `lib/db/services/invoice.service.ts` (if exists)
2. Server actions for saving invoices

**Changes:**
- Ensure new fields are saved/retrieved correctly
- Add migration for existing invoices (set is_buyback = false)
- Handle backward compatibility when reading old invoices

---

### Step 9: Testing Strategy

**Unit Tests:**
1. ✅ Buyback calculation logic
2. ✅ Form validation (buyback mode)
3. ✅ Template rendering (buyback items)
4. ✅ Settings save/load

**Integration Tests:**
1. ✅ Create buyback invoice end-to-end
2. ✅ Switch between regular and buyback modes
3. ✅ Update buyback price in settings
4. ✅ Export buyback invoice as image
5. ✅ Backward compatibility with existing invoices

**Manual Testing Checklist:**
- [ ] Toggle buyback mode works
- [ ] Auto-calculation updates in real-time
- [ ] Settings save/load correctly
- [ ] All 8 templates render buyback items correctly
- [ ] Image export generates correct buyback invoice
- [ ] Regular invoices still work (no regression)
- [ ] Database migration is safe

---

### Step 10: Error Handling

**Edge Cases:**
1. **Buyback price not set:** Show warning in form
2. **Gram = 0:** Prevent submission with error
3. **Negative numbers:** Validate and prevent
4. **Mixed items:** Prevent mixing buyback and regular items
5. **Settings load failure:** Use fallback value (0)

**Error Messages:**
- "Please set buyback price per gram in Settings"
- "Gram must be greater than 0"
- "Cannot mix buyback and regular items in the same invoice"

---

### Step 11: Documentation Updates

**Files to Update:**
1. `README.md` - Add buyback feature documentation
2. Inline code comments
3. Type definitions with JSDoc

---

### Step 12: Deployment Checklist

**Pre-deployment:**
- [ ] Database migration tested on staging
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] No console errors
- [ ] Backward compatibility verified

**Post-deployment:**
- [ ] Verify migration executed on production
- [ ] Test buyback feature in production
- [ ] Monitor for errors
- [ ] Rollback plan ready if needed

---

## Risk Mitigation

### Production Safety
1. **Migration is additive only** - No column drops or alterations
2. **Default values** - New column has default (0)
3. **Backward compatible** - Existing invoices unaffected
4. **Feature flags** - Can disable if issues arise
5. **Rollback plan** - Can drop column if needed

### Testing
1. Test on staging with production-like data
2. Test with existing invoices (no regression)
3. Test with empty/zero values
4. Test image generation with buyback items

---

## Success Criteria

✅ User can set buyback price per gram in Settings
✅ Toggle works to switch between regular/buyback modes
✅ Auto-calculation works correctly (gram × price)
✅ All 8 templates render buyback items properly
✅ Image export generates correct buyback invoice
✅ No regression in existing invoice functionality
✅ Database migration is safe and backward compatible

---

## Estimated Development Time

- Database migration: 30 minutes
- Settings integration: 1 hour
- Form enhancements: 2 hours
- Template modifications: 1-2 hours (8 templates × 15 min each)
- Testing & validation: 1 hour
- **Total: ~5-6 hours**
