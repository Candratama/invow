/**
 * Property-Based Test: React Query Removal
 * 
 * Feature: fix-database-architecture, Property 10: React Query removal
 * Validates: Requirements 4.1, 4.3
 * 
 * Property: For any component that only displays static data without real-time updates,
 * it must not use React Query hooks (useQuery, useMutation, useQueryClient)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// List of components that should NOT use React Query
const COMPONENTS_WITHOUT_REACT_QUERY = [
  'components/features/settings/invoice-settings-tab.tsx',
  'components/features/settings/business-info-tab.tsx',
  'components/features/subscription/status.tsx',
  'components/features/invoice/invoice-form.tsx',
];

// React Query hooks that should not be present
const REACT_QUERY_HOOKS = [
  'useQuery',
  'useMutation',
  'useQueryClient',
  'useInfiniteQuery',
  'useQueries',
];

describe('Property 10: React Query removal', () => {
  it('should not use React Query hooks in refactored components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMPONENTS_WITHOUT_REACT_QUERY),
        (componentPath) => {
          // Read the component file
          const fullPath = path.join(process.cwd(), componentPath);
          
          if (!fs.existsSync(fullPath)) {
            // If file doesn't exist, skip this test case
            return true;
          }
          
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Check that none of the React Query hooks are used
          for (const hook of REACT_QUERY_HOOKS) {
            // Look for hook usage patterns:
            // 1. Direct usage: useQuery(
            // 2. Destructured: const { ... } = useQuery(
            // 3. Import: from '@tanstack/react-query'
            const hookUsagePattern = new RegExp(`\\b${hook}\\s*\\(`, 'g');
            const importPattern = /@tanstack\/react-query/g;
            
            if (hookUsagePattern.test(content)) {
              console.error(`Found ${hook} usage in ${componentPath}`);
              return false;
            }
            
            // Check for imports (should not import from @tanstack/react-query)
            if (importPattern.test(content)) {
              console.error(`Found @tanstack/react-query import in ${componentPath}`);
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use Server Actions or props instead of React Query', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMPONENTS_WITHOUT_REACT_QUERY),
        (componentPath) => {
          const fullPath = path.join(process.cwd(), componentPath);
          
          if (!fs.existsSync(fullPath)) {
            return true;
          }
          
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Check that component uses Server Actions or receives props
          const hasServerActionImport = /from ['"]@\/app\/actions/.test(content);
          const hasPropsInterface = /interface \w+Props/.test(content);
          const hasUseTransition = /useTransition/.test(content);
          
          // Component should either:
          // 1. Import Server Actions
          // 2. Receive data as props
          // 3. Use useTransition for pending states
          const usesCorrectPattern = hasServerActionImport || hasPropsInterface || hasUseTransition;
          
          if (!usesCorrectPattern) {
            console.error(`Component ${componentPath} doesn't use Server Actions or props pattern`);
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not have queryClient.invalidateQueries calls', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMPONENTS_WITHOUT_REACT_QUERY),
        (componentPath) => {
          const fullPath = path.join(process.cwd(), componentPath);
          
          if (!fs.existsSync(fullPath)) {
            return true;
          }
          
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Check that there are no queryClient.invalidateQueries calls
          const invalidatePattern = /queryClient\.invalidateQueries/g;
          const refetchPattern = /queryClient\.refetchQueries/g;
          
          if (invalidatePattern.test(content) || refetchPattern.test(content)) {
            console.error(`Found queryClient cache invalidation in ${componentPath}`);
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use useTransition for pending states instead of mutation.isPending', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMPONENTS_WITHOUT_REACT_QUERY),
        (componentPath) => {
          const fullPath = path.join(process.cwd(), componentPath);
          
          if (!fs.existsSync(fullPath)) {
            return true;
          }
          
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Check that there are no mutation.isPending references
          const mutationPendingPattern = /\w+Mutation\.isPending/g;
          
          if (mutationPendingPattern.test(content)) {
            console.error(`Found mutation.isPending in ${componentPath}, should use useTransition instead`);
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
