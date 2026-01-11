# Fix PostgREST .single() Anti-Pattern Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix "Cannot coerce to JSON object" error caused by `.limit(1).single()` anti-pattern in StoresService

**Architecture:** Replace `.single()` with `.maybeSingle()` in queries that use `.limit(1)` with JOINs. PostgREST's `.single()` expects exactly one row and fails with nested objects from JOINs. `.maybeSingle()` is more tolerant and returns null if no rows found.

**Tech Stack:** TypeScript, Supabase (PostgREST), Vitest

**Affected User:** iisbatangan96@gmail.com - Premium subscriber unable to save invoice settings

---

## Task 1: Write Failing Test for getDefaultStore

**Files:**
- Create: `lib/db/services/__tests__/stores.service.single-pattern.test.ts`

**Step 1: Write the failing test**

Create test file with scenario that reproduces the issue:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { StoresService } from '../stores.service';

describe('StoresService - .single() anti-pattern fix', () => {
  let service: StoresService;
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    // Use test Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    service = new StoresService(supabase);
  });

  it('should return default store with store_contacts JOIN without coercion error', async () => {
    // This test verifies the fix for the "Cannot coerce to JSON object" error
    // that occurs when using .limit(1).single() with JOINs

    const result = await service.getDefaultStore();

    // Should not throw "Cannot coerce to single JSON object" error
    expect(result.error).toBeNull();

    // Should return store with nested store_contacts
    if (result.data) {
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      // store_contacts might be null or array
      expect(result.data).toHaveProperty('store_contacts');
    }
  });

  it('should handle user with no stores gracefully', async () => {
    // Mock user with no stores - should return null without error
    const result = await service.getDefaultStore();

    // Should not throw error even if no stores found
    expect(result.error).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails (or identify the pattern)**

Run: `npm test -- stores.service.single-pattern.test.ts`

Expected: Test may pass or fail depending on data, but code inspection shows the anti-pattern exists

**Step 3: Commit test**

```bash
git add lib/db/services/__tests__/stores.service.single-pattern.test.ts
git commit -m "test: add test for getDefaultStore .single() anti-pattern"
```

---

## Task 2: Fix getDefaultStore Method

**Files:**
- Modify: `lib/db/services/stores.service.ts` (getDefaultStore method, approximately line 60-80)

**Step 1: Locate the problematic code**

Find this pattern in `getDefaultStore()` method:

```typescript
// Fallback: Get first active store
const { data, error } = await this.supabase
  .from("stores")
  .select(`
    *,
    store_contacts (
      id,
      name,
      title,
      signature,
      is_primary
    )
  `)
  .eq("user_id", user.id)
  .eq("is_active", true)
  .order("created_at", { ascending: true })
  .limit(1)
  .single();  // ← PROBLEM: .single() with JOIN
```

**Step 2: Replace .single() with .maybeSingle()**

Change the code to:

```typescript
// Fallback: Get first active store
const { data, error } = await this.supabase
  .from("stores")
  .select(`
    *,
    store_contacts (
      id,
      name,
      title,
      signature,
      is_primary
    )
  `)
  .eq("user_id", user.id)
  .eq("is_active", true)
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();  // ✅ FIXED: .maybeSingle() handles JOINs better
```

**Step 3: Also check and fix the preferred store query**

Find this code (around line 40-50):

```typescript
const { data: defaultStore } = await this.supabase
  .from("stores")
  .select(`
    *,
    store_contacts (
      id,
      name,
      title,
      signature,
      is_primary
    )
  `)
  .eq("id", preferences.default_store_id)
  .eq("is_active", true)
  .single();  // ← ALSO PROBLEM
```

Replace with:

```typescript
const { data: defaultStore } = await this.supabase
  .from("stores")
  .select(`
    *,
    store_contacts (
      id,
      name,
      title,
      signature,
      is_primary
    )
  `)
  .eq("id", preferences.default_store_id)
  .eq("is_active", true)
  .maybeSingle();  // ✅ FIXED
```

**Step 4: Run tests**

Run: `npm test -- stores.service`

Expected: All tests pass

**Step 5: Commit fix**

```bash
git add lib/db/services/stores.service.ts
git commit -m "fix: replace .single() with .maybeSingle() in getDefaultStore

Fixes 'Cannot coerce to JSON object' error when querying stores
with store_contacts JOIN. .maybeSingle() is more tolerant with
nested objects from relationships.

Resolves issue for user iisbatangan96@gmail.com"
```

---

## Task 3: Audit and Fix Other .single() Anti-Patterns

**Files:**
- Search: All service files for `.limit(1).single()` or `.single()` with JOINs

**Step 1: Search for similar patterns**

Run: `grep -r "\.single()" lib/db/services/*.ts --include="*.ts" -B5 | grep -E "(select|\.from)" -A5`

This finds all `.single()` calls and shows context

**Step 2: Identify problematic patterns**

Look for:
- `.limit(1).single()` ← Always problematic
- `.single()` after `.select('*, relation(...)')` ← Problematic with JOINs

Safe patterns:
- `.eq("id", id).single()` without JOIN ← OK (unique constraint)
- `.eq("user_id", userId).single()` on tables with UNIQUE constraint ← OK

**Step 3: Document findings**

Create list of files that need fixing (if any):

```bash
# Example command to find all instances
grep -r "\.limit(1)\.single()" lib/db/services/*.ts -l
```

**Step 4: Fix each instance**

For each file found, apply the same pattern:
- If `.limit(1).single()`: Change to `.limit(1).maybeSingle()`
- If `.single()` with JOIN: Change to `.maybeSingle()`

**Step 5: Commit each fix separately**

```bash
git add lib/db/services/<filename>.ts
git commit -m "fix: replace .single() anti-pattern in <ServiceName>"
```

---

## Task 4: Add Code Comments for Future Prevention

**Files:**
- Modify: `lib/db/services/stores.service.ts`
- Modify: `lib/db/services/user-preferences.service.ts`

**Step 1: Add JSDoc comment to getDefaultStore**

Add comment above the `getDefaultStore()` method:

```typescript
/**
 * Get user's default store with store contacts
 *
 * @returns Store with nested store_contacts relation
 *
 * @note Uses .maybeSingle() instead of .single() to handle
 * PostgREST nested objects from JOINs. .single() can fail with
 * "Cannot coerce to JSON object" when relations are present.
 */
async getDefaultStore(): Promise<{
  data: Store | null;
  error: Error | null;
}> {
```

**Step 2: Add comment to updatePreferences**

Add warning comment in user-preferences.service.ts:

```typescript
/**
 * Update user preferences
 *
 * @note Uses .single() safely here because there's a UNIQUE
 * constraint on user_id and no JOINs in the query.
 */
async updatePreferences(
  updates: UserPreferencesUpdate,
): Promise<{
  data: UserPreferences | null;
  error: Error | null;
}> {
```

**Step 3: Commit documentation**

```bash
git add lib/db/services/stores.service.ts lib/db/services/user-preferences.service.ts
git commit -m "docs: add comments explaining .single() vs .maybeSingle() usage"
```

---

## Task 5: Integration Test with Actual User Scenario

**Files:**
- Create: `lib/db/services/__tests__/stores.service.integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { StoresService } from '../stores.service';
import { UserPreferencesService } from '../user-preferences.service';

describe('StoresService - Integration test for invoice settings save', () => {
  it('should successfully save invoice settings with store update', async () => {
    // Simulate the exact flow that was failing:
    // 1. Get default store (with JOIN)
    // 2. Update store payment method
    // 3. Update user preferences template

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const storesService = new StoresService(supabase);
    const prefsService = new UserPreferencesService(supabase);

    // Step 1: Get default store (this was failing with .single())
    const { data: store, error: storeError } = await storesService.getDefaultStore();

    expect(storeError).toBeNull();
    expect(store).toBeDefined();

    if (!store) return;

    // Step 2: Update store (simulating payment method change)
    const { error: updateStoreError } = await storesService.updateStore(
      store.id,
      { payment_method: 'BCA - 1234567890' }
    );

    expect(updateStoreError).toBeNull();

    // Step 3: Update preferences (simulating template selection)
    const { error: updatePrefsError } = await prefsService.updatePreferences({
      selected_template: 'modern',
      export_quality_kb: 100,
    });

    expect(updatePrefsError).toBeNull();

    // All operations should succeed without "Cannot coerce" error
  });
});
```

**Step 2: Run integration test**

Run: `npm test -- stores.service.integration.test.ts`

Expected: PASS - No "Cannot coerce" errors

**Step 3: Commit test**

```bash
git add lib/db/services/__tests__/stores.service.integration.test.ts
git commit -m "test: add integration test for invoice settings save flow"
```

---

## Task 6: Manual Testing with Affected User

**Files:**
- None (manual testing)

**Step 1: Build and deploy to staging**

```bash
npm run build
# Deploy to staging environment
```

**Step 2: Test with user scenario**

1. Login as test user or create new premium user
2. Go to Settings > Invoice Settings
3. Select a different template (e.g., "Modern" → "Elegant")
4. Click "Save Invoice Settings"
5. Verify: Success toast appears
6. Verify: No "Cannot coerce to JSON object" error

**Step 3: Verify fix for actual affected user**

If possible, ask user iisbatangan96@gmail.com to test:
1. Go to Invoice Settings
2. Change template
3. Click Save
4. Confirm success

**Step 4: Document test results**

Create test report in `docs/testing/`:

```markdown
# PostgREST .single() Fix - Test Report

**Date:** 2026-01-11
**Tester:** [Name]

## Test Scenarios

### Scenario 1: Template Selection Save
- [x] Select different template
- [x] Save settings
- [x] No error displayed
- [x] Settings persisted

### Scenario 2: User with Store Contacts
- [x] User has store with contacts
- [x] Can load settings page
- [x] Can save changes

### Scenario 3: User with No Store
- [x] New user with no store
- [x] Settings page loads
- [x] Creates store on save

## Results

All scenarios: PASS ✅
No "Cannot coerce to JSON object" errors observed.
```

---

## Task 7: Create Pull Request

**Files:**
- None (Git operations)

**Step 1: Review all changes**

```bash
git log --oneline origin/main..HEAD
git diff origin/main...HEAD
```

**Step 2: Push branch**

```bash
git push origin fix/postgrest-single-anti-pattern
```

**Step 3: Create PR with description**

PR Title: `fix: resolve "Cannot coerce to JSON object" error in invoice settings`

PR Description:
```markdown
## Problem

Premium user iisbatangan96@gmail.com encountered error when saving invoice settings:
- Error: "Failed to save: Cannot coerce the result to a single JSON object"
- Location: Invoice Settings > Save button
- Cause: `.limit(1).single()` anti-pattern with PostgREST JOINs

## Root Cause

`StoresService.getDefaultStore()` used `.limit(1).single()` with JOIN:
```typescript
.select('*, store_contacts(...)')
.limit(1)
.single()  // ❌ Fails with nested objects
```

PostgREST's `.single()` expects exactly 1 flat row. With JOINs, it returns nested objects and fails to coerce.

## Solution

Replace `.single()` → `.maybeSingle()` in queries with JOINs:
```typescript
.select('*, store_contacts(...)')
.limit(1)
.maybeSingle()  // ✅ Handles nested objects
```

## Changes

- Fixed `StoresService.getDefaultStore()` (2 locations)
- Added tests for .single() anti-pattern
- Added integration test for invoice settings flow
- Added code comments for future prevention

## Testing

- [x] Unit tests pass
- [x] Integration test pass
- [x] Manual testing: Invoice settings save works
- [x] No regression in other features

## Related Issues

Resolves issue for user iisbatangan96@gmail.com
```

**Step 4: Request review**

Tag reviewers and wait for approval

---

## Verification Checklist

After all tasks complete:

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] PR created and approved
- [ ] Changes deployed
- [ ] User notified of fix

---

## Rollback Plan

If issues arise after deployment:

```bash
# Revert the changes
git revert <commit-hash>

# Or revert entire PR
git revert -m 1 <merge-commit-hash>

# Deploy reverted version
npm run build && deploy
```

---

## Future Prevention

**Code Review Guideline:**
- Always use `.maybeSingle()` instead of `.single()` when:
  - Query uses `.limit(1)`
  - Query has JOINs (relations in select)
  - Not certain table has unique constraint

**Safe to use `.single()`:**
- Query on primary key: `.eq("id", id).single()`
- Query on unique constraint: `.eq("user_id", userId).single()` (if UNIQUE)
- No JOINs in select

**Linting Rule (Future):**
Consider adding ESLint rule to detect `.limit(1).single()` pattern.
