# DB Safe-Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Knock out the lowest-risk advisor findings from the Supabase performance/security linter against the production database — Tier 1 (zero-risk: Auth dashboard toggle + code-only invalidation expansion) and Tier 2 (low-risk DDL: function search_path + 1 RLS init-plan POC on the smallest table).

**Architecture:** Each fix is independent and additive. Auth setting + code changes ship through the existing Next.js + React Query flow. DB fixes ship as a single, idempotent SQL migration that can be applied via Supabase MCP `apply_migration` or reverted with a paired down migration. No schema changes, no data writes, no policy semantics changes — only metadata (function search_path) and re-binding `auth.uid()` to `(select auth.uid())` inside RLS policies for query-plan caching.

**Tech Stack:** Supabase Postgres, Supabase Auth dashboard, Next.js 16 server actions, `@tanstack/react-query`, vitest + fast-check property tests.

---

## File Structure

**Code files affected:**
- `lib/hooks/use-invalidate-related.ts` — expand `afterSettingsMutation` and `afterCustomerMutation` to invalidate the cross-page caches that already exist (`dashboardKeys.metrics`, `reportKeys.all`)
- `lib/hooks/__tests__/use-invalidate-related.property.test.tsx` — update property tests for the new invalidation call counts and key set

**Database migrations (created by `apply_migration`):**
- `2026_05_05_set_function_search_path` — `ALTER FUNCTION` on the two SECURITY DEFINER user functions to pin their `search_path`
- `2026_05_05_rls_initplan_user_preferences` — re-binds `auth.uid()` to `(select auth.uid())` inside the 4 RLS policies on `public.user_preferences` only (the POC)

**Manual config (not in git):**
- Supabase Dashboard → Authentication → Settings → "Check passwords against HaveIBeenPwned" toggle

---

## Task 1: Enable Leaked Password Protection (manual, Auth dashboard)

This is the only step in the plan that is not automatable through code or MCP. It is reversible from the same screen and changes no schema. Document for the operator and verify via the advisor.

**Files:**
- None (Supabase Dashboard setting)

- [ ] **Step 1: Operator action — toggle in Supabase Dashboard**

  1. Open https://supabase.com/dashboard/project/qlupjzxdqdvbpwltpesu/auth/policies → "Auth Settings" tab
  2. Scroll to "Password Protection"
  3. Enable "Check passwords against the HaveIBeenPwned breach database"
  4. Save

- [ ] **Step 2: Verify via security advisor**

  Run via MCP:
  ```
  mcp__supabase__get_advisors(type: "security")
  ```
  Expected: the advisor entry with `"name":"auth_leaked_password_protection"` no longer appears.

- [ ] **Step 3: Commit a tracking note**

  ```bash
  git commit --allow-empty -m "ops: enable HaveIBeenPwned password protection in Supabase Auth"
  ```

---

## Task 2: Expand `afterSettingsMutation` invalidations (code only)

**Why:** Settings mutations (store info, preferences) currently only invalidate `settingsKeys.all` + `dashboardKeys.revenue()`. They miss `dashboardKeys.metrics()` (which carries the `allInvoices` blob feeding FinancialCards) and `reportKeys.all`. Effect today: changing a store name doesn't propagate to the cached invoice list shown on the report page until the user reloads. Same additive pattern as the recent `afterInvoiceMutation` fix.

**Files:**
- Modify: `lib/hooks/use-invalidate-related.ts` (around lines 33-41)
- Test: `lib/hooks/__tests__/use-invalidate-related.property.test.tsx` (around lines 131-164)

- [ ] **Step 1: Update the failing property test first**

  Edit `lib/hooks/__tests__/use-invalidate-related.property.test.tsx`. Locate the `afterSettingsMutation invalidates settings and dashboard revenue caches` test (around line 131) and replace it with:

  ```tsx
    it("afterSettingsMutation invalidates settings + dashboard.revenue + dashboard.metrics + report.all", () => {
      fc.assert(
        fc.property(fc.constant(true), () => {
          const { wrapper, invalidateQueriesSpy } = createWrapper();

          const { result } = renderHook(() => useInvalidateRelatedQueries(), {
            wrapper,
          });

          result.current.afterSettingsMutation();

          // Expect 4 invalidations: settings.all, dashboard.revenue,
          // dashboard.metrics, report.all
          expect(invalidateQueriesSpy).toHaveBeenCalledTimes(4);

          const settingsCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(settingsKeys.all)
          );
          expect(settingsCall).toBeDefined();

          const revenueCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(dashboardKeys.revenue())
          );
          expect(revenueCall).toBeDefined();

          const metricsCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(dashboardKeys.metrics())
          );
          expect(metricsCall).toBeDefined();

          const reportCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(reportKeys.all)
          );
          expect(reportCall).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx -t "afterSettingsMutation"
  ```
  Expected: FAIL with `Expected number of calls: 4 / Received: 2`.

- [ ] **Step 3: Update `afterSettingsMutation` in source**

  Open `lib/hooks/use-invalidate-related.ts`. Locate the existing `afterSettingsMutation` (around line 37) and replace it with:

  ```ts
    /**
     * Invalidate after settings mutation (store info, preferences).
     * Touches every cache that may have snapshotted store metadata, tier
     * limits, or feature flags so dashboard + report stay in sync.
     */
    const afterSettingsMutation = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.revenue() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    }, [queryClient]);
  ```

- [ ] **Step 4: Re-run the property test, confirm pass**

  ```bash
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx -t "afterSettingsMutation"
  ```
  Expected: PASS.

- [ ] **Step 5: Run the full property file to make sure neighbours still pass**

  ```bash
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx
  ```
  Expected: PASS for all 6 cases.

- [ ] **Step 6: Commit**

  ```bash
  git add lib/hooks/use-invalidate-related.ts lib/hooks/__tests__/use-invalidate-related.property.test.tsx
  git commit -m "fix(cache): settings mutation also busts dashboard.metrics + report.all"
  ```

---

## Task 3: Expand `afterCustomerMutation` invalidations (code only)

**Why:** Customer mutations currently only invalidate `customersKeys.list(storeId)`. They miss `reportKeys.all`, which means the report's "Top Customers" table and `activeCustomers` count keep stale data after a customer create/update/delete. Additive, no risk.

**Files:**
- Modify: `lib/hooks/use-invalidate-related.ts` (around lines 43-52)
- Test: `lib/hooks/__tests__/use-invalidate-related.property.test.tsx` (around lines 166-193)

- [ ] **Step 1: Update the failing property test first**

  Locate the `afterCustomerMutation invalidates customers list cache for specific storeId` test (around line 166) and replace it with:

  ```tsx
    it("afterCustomerMutation invalidates customers list + report.all for specific storeId", () => {
      fc.assert(
        fc.property(fc.uuid(), (storeId) => {
          const { wrapper, invalidateQueriesSpy } = createWrapper();

          const { result } = renderHook(() => useInvalidateRelatedQueries(), {
            wrapper,
          });

          result.current.afterCustomerMutation(storeId);

          // Expect 2 invalidations: customers.list(storeId) + report.all
          expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);

          const customersCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(customersKeys.list(storeId))
          );
          expect(customersCall).toBeDefined();

          const reportCall = invalidateQueriesSpy.mock.calls.find(
            (call) =>
              JSON.stringify(call[0]?.queryKey) ===
              JSON.stringify(reportKeys.all)
          );
          expect(reportCall).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  ```

  Also locate the `multiple sequential mutations invalidate correct caches independently` test (around line 228) and update the expected total count comment + assertion. Replace its body comments and the `expect(invalidateQueriesSpy).toHaveBeenCalledTimes(9)` line with:

  ```tsx
            // Invoice with storeId: 5 (revenue + invoices + metrics + report.all + customers)
            // Settings: 4 (settings.all + dashboard.revenue + dashboard.metrics + report.all)
            // Customer x2: 4 (customers.list + report.all, twice)
            expect(invalidateQueriesSpy).toHaveBeenCalledTimes(13);
  ```

  Update the trailing comment `// 3 customer invalidations` only if the literal text says `3`; the customer-key invalidation count stays at 3 (1 from invoice + 2 from customer mutations).

- [ ] **Step 2: Run the failing tests, confirm they fail with the new expectations**

  ```bash
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx -t "afterCustomerMutation"
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx -t "multiple sequential mutations"
  ```
  Expected: FAIL — call counts mismatched.

- [ ] **Step 3: Update `afterCustomerMutation` in source**

  Locate the existing `afterCustomerMutation` callback and replace it with:

  ```ts
    /**
     * Invalidate after customer mutation (create/update/delete).
     * Customer rows feed the report's Top-Customers tables and the
     * activeCustomers count, so we bust report.all here as well as the
     * store-scoped customers list.
     */
    const afterCustomerMutation = useCallback(
      (storeId: string) => {
        queryClient.invalidateQueries({ queryKey: customersKeys.list(storeId) });
        queryClient.invalidateQueries({ queryKey: reportKeys.all });
      },
      [queryClient]
    );
  ```

- [ ] **Step 4: Re-run the failing tests, confirm they pass**

  ```bash
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx
  ```
  Expected: PASS for all 6 cases.

- [ ] **Step 5: Run a build to make sure nothing else regressed**

  ```bash
  npm run build
  ```
  Expected: `✓ Compiled successfully` and `✓ Generating static pages using 7 workers (38/38)`.

- [ ] **Step 6: Commit**

  ```bash
  git add lib/hooks/use-invalidate-related.ts lib/hooks/__tests__/use-invalidate-related.property.test.tsx
  git commit -m "fix(cache): customer mutation also busts report.all"
  ```

---

## Task 4: Pin `search_path` on the two SECURITY DEFINER functions

**Why:** The performance advisor's `function_search_path_mutable` lint flags `public.create_user_store` and `public.get_user_default_store`. Both are SECURITY DEFINER, both have `proconfig IS NULL`. A SECURITY DEFINER function with a mutable search path can be exploited by an attacker who manipulates their own `search_path` before calling the function (e.g., dropping in a shim table in front of `public.stores`). We pin `search_path = public, pg_temp` — explicit, idempotent, no behavior change because every reference inside these functions already targets `public.*`.

**Files:**
- Apply via MCP: `mcp__supabase__apply_migration` with name `pin_function_search_path` and the migration body below

- [ ] **Step 1: Verify the two functions are still the only flagged candidates**

  Run via MCP:
  ```
  mcp__supabase__get_advisors(type: "security")
  ```
  Expected: confirm 2 entries with `"name":"function_search_path_mutable"`, both naming `create_user_store` and `get_user_default_store`. If the list has grown, expand this task's migration to cover the new functions before proceeding.

- [ ] **Step 2: Apply the migration**

  Run via MCP:
  ```
  mcp__supabase__apply_migration(
    name: "pin_function_search_path",
    query: <<<SQL
      -- Pin search_path on SECURITY DEFINER functions to prevent
      -- shim-table attacks via the caller's search_path. The body of
      -- each function already qualifies every object with its schema,
      -- so this is a no-op semantically.
      ALTER FUNCTION public.create_user_store(
        uuid, text, text, text, text, text, text, text, text, text, text, text, text
      ) SET search_path = public, pg_temp;

      ALTER FUNCTION public.get_user_default_store(uuid)
        SET search_path = public, pg_temp;
    SQL
  )
  ```

- [ ] **Step 3: Verify the change took effect**

  Run via MCP:
  ```
  mcp__supabase__execute_sql(
    query: "SELECT proname, proconfig FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('create_user_store','get_user_default_store');"
  )
  ```
  Expected: both rows show `proconfig` containing `{search_path=public, pg_temp}`.

- [ ] **Step 4: Smoke-test the functions still work**

  From the running app, log in as any user and create a brand-new store (Settings → Business → fill the form → Save). `create_user_store` and `get_user_default_store` are both exercised by this flow. Verify the store is created and the dashboard subsequently renders it.

- [ ] **Step 5: Re-run advisor to confirm lint cleared**

  Run via MCP:
  ```
  mcp__supabase__get_advisors(type: "security")
  ```
  Expected: 0 entries with `"name":"function_search_path_mutable"`.

- [ ] **Step 6: Commit a tracking note (the migration lives on Supabase, not in git)**

  ```bash
  git commit --allow-empty -m "db(security): pin search_path on create_user_store + get_user_default_store"
  ```

---

## Task 5: RLS init-plan POC on `public.user_preferences`

**Why:** The performance advisor flags 42 RLS policies that re-evaluate `auth.uid()` for every row. Wrapping `auth.uid()` in `(select auth.uid())` lets Postgres treat it as an initplan (evaluated once per query) instead of a per-row volatile call. The transformation is semantically identical and officially recommended by Supabase. We do the POC on `user_preferences` (4 simple policies, smallest impact if anything goes wrong) before bulking the remaining 38 in a follow-up plan.

**Files:**
- Apply via MCP: `mcp__supabase__apply_migration` with name `rls_initplan_user_preferences` and the migration body below

- [ ] **Step 1: Pre-flight — capture current policy bodies**

  Run via MCP:
  ```
  mcp__supabase__execute_sql(
    query: "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' ORDER BY policyname;"
  )
  ```
  Save the output. Expected: 4 rows, each with `(auth.uid() = user_id)` in `qual` and/or `with_check`. This is the rollback reference.

- [ ] **Step 2: Apply the migration**

  Run via MCP:
  ```
  mcp__supabase__apply_migration(
    name: "rls_initplan_user_preferences",
    query: <<<SQL
      -- Switch auth.uid() to (select auth.uid()) inside the 4 RLS
      -- policies on public.user_preferences so Postgres evaluates the
      -- auth call once per query instead of once per row. Semantics
      -- are identical; only the query plan changes.
      DROP POLICY IF EXISTS "Users can view own preferences"   ON public.user_preferences;
      DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
      DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
      DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

      CREATE POLICY "Users can view own preferences"
        ON public.user_preferences
        FOR SELECT
        USING ((select auth.uid()) = user_id);

      CREATE POLICY "Users can insert own preferences"
        ON public.user_preferences
        FOR INSERT
        WITH CHECK ((select auth.uid()) = user_id);

      CREATE POLICY "Users can update own preferences"
        ON public.user_preferences
        FOR UPDATE
        USING ((select auth.uid()) = user_id)
        WITH CHECK ((select auth.uid()) = user_id);

      CREATE POLICY "Users can delete own preferences"
        ON public.user_preferences
        FOR DELETE
        USING ((select auth.uid()) = user_id);
    SQL
  )
  ```

- [ ] **Step 3: Verify the new policy bodies**

  Run via MCP:
  ```
  mcp__supabase__execute_sql(
    query: "SELECT policyname, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' ORDER BY policyname;"
  )
  ```
  Expected: all 4 rows now contain `((SELECT auth.uid() AS uid) = user_id)` in `qual` and/or `with_check`.

- [ ] **Step 4: Confirm read still works for the authenticated user**

  From the running app, log in as the `joyragoldstore@gmail.com` account, navigate to Settings → Invoice Settings. The export-quality / tax / template fields hit `user_preferences`. Verify they load and a toggle (e.g. tax on/off) saves successfully.

- [ ] **Step 5: Confirm isolation still works**

  Run via MCP with a deliberately wrong user id to make sure the policy still scopes correctly:
  ```
  mcp__supabase__execute_sql(
    query: "SELECT count(*) FROM public.user_preferences;"
  )
  ```
  Expected: returns total row count across all users (MCP runs as service role and bypasses RLS — this just confirms the table is reachable; the real isolation check happens in Step 4 from the app).

- [ ] **Step 6: Re-run performance advisor**

  Run via MCP:
  ```
  mcp__supabase__get_advisors(type: "performance")
  ```
  Expected: 4 fewer `auth_rls_initplan` entries (38 instead of 42), and none of the remaining entries name `user_preferences`.

- [ ] **Step 7: Commit a tracking note**

  ```bash
  git commit --allow-empty -m "db(perf): RLS initplan POC on user_preferences (4 policies)"
  ```

- [ ] **Step 8: Hand-off note — next plan**

  Create `docs/superpowers/plans/NEXT-rls-initplan-bulk.md` with a one-line stub:

  ```bash
  cat > docs/superpowers/plans/NEXT-rls-initplan-bulk.md <<'EOF'
  # Next: RLS init-plan bulk migration (38 remaining policies)

  POC on `user_preferences` validated in
  `docs/superpowers/plans/2026-05-05-db-safe-fixes.md` Task 5. The same
  pattern (DROP / CREATE with `(select auth.uid())`) applies to every
  remaining policy flagged by the `auth_rls_initplan` advisor lint.
  Plan to be written when ready to proceed.
  EOF
  git add docs/superpowers/plans/NEXT-rls-initplan-bulk.md
  git commit -m "docs: stub follow-up plan for bulk RLS init-plan migration"
  ```

---

## Final Verification

- [ ] **Run the property tests**

  ```bash
  npx vitest run lib/hooks/__tests__/use-invalidate-related.property.test.tsx
  ```
  Expected: PASS for all 6 property tests.

- [ ] **Run the build**

  ```bash
  npm run build
  ```
  Expected: `✓ Compiled successfully` and `✓ Generating static pages using 7 workers (38/38)`.

- [ ] **Re-run both advisors and capture the delta**

  Run via MCP:
  ```
  mcp__supabase__get_advisors(type: "security")
  mcp__supabase__get_advisors(type: "performance")
  ```
  Expected deltas:
  - Security: `auth_leaked_password_protection` cleared (1 → 0), `function_search_path_mutable` cleared (2 → 0).
  - Performance: `auth_rls_initplan` reduced from 42 → 38.

- [ ] **Push branch + open PR (or push to existing PR)**

  ```bash
  git push
  ```
  If `fix/page-load-skeleton-flash` is still the active branch with PR #7 open, this lands the commits on the same PR for review.
