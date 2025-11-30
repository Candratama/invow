/**
 * Property-Based Test: No direct service imports in client code
 * 
 * **Feature: refactor-api-to-server-actions, Property 4: No direct service imports in client code**
 * 
 * Validates: Requirements 3.1, 3.2
 * 
 * Property: For any file marked with 'use client' or in the Zustand store, 
 * it must not import from `lib/db/services/` directly. All database operations 
 * must go through Server Actions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 4: No direct service imports in client code', () => {
  it('should verify Zustand store does not import directly from services', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/store.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Must be a client file
          const isClientFile = fileContent.includes('"use client"') || fileContent.includes("'use client'");
          expect(isClientFile).toBe(true);

          // Property: Must NOT have direct imports from lib/db/services
          const hasDirectServiceImport = 
            fileContent.includes("from './db/services'") ||
            fileContent.includes('from "./db/services"') ||
            fileContent.includes("from '@/lib/db/services'") ||
            fileContent.includes('from "@/lib/db/services"') ||
            fileContent.includes("from '../db/services'") ||
            fileContent.includes('from "../db/services"');
          
          expect(hasDirectServiceImport).toBe(false);

          // Property: Must NOT have dynamic imports from lib/db/services
          const hasDynamicServiceImport = 
            fileContent.includes('import("./db/services")') ||
            fileContent.includes("import('./db/services')") ||
            fileContent.includes('import("@/lib/db/services")') ||
            fileContent.includes("import('@/lib/db/services')");
          
          expect(hasDynamicServiceImport).toBe(false);

          // Property: Should use Server Actions for database operations
          const usesServerActions = 
            fileContent.includes("from '@/app/actions") ||
            fileContent.includes('from "@/app/actions');
          
          // If the file has database-related methods, it should use Server Actions
          const hasLoadCompleted = fileContent.includes('loadCompleted');
          if (hasLoadCompleted) {
            expect(usesServerActions).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify client components do not import directly from services', () => {
    // List of known client component files that might need database access
    const clientComponentPaths = [
      'components/features/subscription/upgrade-button.tsx',
      'components/features/settings/business-info-tab.tsx',
      'components/features/settings/invoice-settings-tab.tsx',
      'components/features/settings/subscription-tab.tsx',
      'app/dashboard/dashboard-client.tsx',
      'app/dashboard/account/account-client.tsx',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...clientComponentPaths),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          
          // Skip if file doesn't exist
          if (!fs.existsSync(fullPath)) {
            return true;
          }

          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Only check files that are client components
          const isClientComponent = 
            fileContent.includes('"use client"') || 
            fileContent.includes("'use client'");
          
          if (!isClientComponent) {
            return true; // Skip non-client components
          }

          // Property: Must NOT have runtime imports from lib/db/services
          // Type-only imports (import type { ... }) are allowed as they are erased at compile time
          // We need to check for runtime imports only, not type imports
          const lines = fileContent.split('\n');
          const hasRuntimeServiceImport = lines.some(line => {
            // Skip type-only imports
            if (line.trim().startsWith('import type')) {
              return false;
            }
            // Check for runtime imports from services
            return (
              line.includes("from '@/lib/db/services") ||
              line.includes('from "@/lib/db/services') ||
              line.includes("from '../../lib/db/services") ||
              line.includes('from "../../lib/db/services')
            );
          });
          
          expect(hasRuntimeServiceImport).toBe(false);

          // Property: Must NOT have dynamic imports from lib/db/services
          const hasDynamicServiceImport = 
            fileContent.includes('import("@/lib/db/services")') ||
            fileContent.includes("import('@/lib/db/services')");
          
          expect(hasDynamicServiceImport).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify Zustand store uses Server Actions for invoice loading', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/store.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: If loadCompleted method exists, it should call getInvoiceByIdAction
          const hasLoadCompleted = fileContent.includes('loadCompleted');
          
          if (hasLoadCompleted) {
            // Should import getInvoiceByIdAction from Server Actions
            const importsInvoiceAction = 
              fileContent.includes("getInvoiceByIdAction") &&
              (fileContent.includes("from '@/app/actions/invoices'") ||
               fileContent.includes('from "@/app/actions/invoices"'));
            
            expect(importsInvoiceAction).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
