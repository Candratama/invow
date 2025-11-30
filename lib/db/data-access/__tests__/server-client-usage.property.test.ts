/**
 * Property-Based Test: Server client usage
 * 
 * **Feature: fix-database-architecture, Property 7: Server client usage**
 * 
 * Validates: Requirements 3.5, 10.2, 10.3
 * 
 * Property: For any server-side database operation, it must use createClient() 
 * from '@/lib/supabase/server', not from '@/lib/supabase/client'
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 7: Server client usage', () => {
  it('should verify all data access layer files import from server, not client', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'preferences.ts',
          'subscription.ts',
          'store.ts',
          'invoices.ts'
        ),
        (fileName) => {
          const filePath = path.join(process.cwd(), 'lib/db/data-access', fileName);
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must import from server, not client
          const hasServerImport = fileContent.includes("from '@/lib/supabase/server'");
          const hasClientImport = fileContent.includes("from '@/lib/supabase/client'");

          expect(hasServerImport).toBe(true);
          expect(hasClientImport).toBe(false);

          // Additional check: Must have 'server-only' import
          const hasServerOnly = fileContent.includes("import 'server-only'");
          expect(hasServerOnly).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all Server Actions import from server, not client', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'preferences.ts',
          'store.ts',
          'subscription.ts',
          'invoices.ts'
        ),
        (fileName) => {
          const filePath = path.join(process.cwd(), 'app/actions', fileName);
          
          // Check if file exists
          if (!fs.existsSync(filePath)) {
            return true; // Skip if file doesn't exist
          }

          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must import from server, not client
          const hasServerImport = fileContent.includes("from '@/lib/supabase/server'");
          const hasClientImport = fileContent.includes("from '@/lib/supabase/client'");

          expect(hasServerImport).toBe(true);
          expect(hasClientImport).toBe(false);

          // Additional check: Must have 'use server' directive
          const hasUseServer = fileContent.includes("'use server'") || fileContent.includes('"use server"');
          expect(hasUseServer).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify Server Components (pages) do not import browser client', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'app/dashboard/page.tsx',
          'app/page.tsx'
        ),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          
          // Check if file exists
          if (!fs.existsSync(fullPath)) {
            return true; // Skip if file doesn't exist
          }

          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Server Components should not import browser client
          const hasClientImport = fileContent.includes("from '@/lib/supabase/client'");
          
          // If it's a client component (has 'use client'), this check doesn't apply
          const isClientComponent = fileContent.includes("'use client'") || fileContent.includes('"use client"');
          
          if (!isClientComponent) {
            expect(hasClientImport).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify API routes use server client', () => {
    const apiRoutes = [
      'app/api/payments/verify/route.ts',
      'app/api/payments/create-invoice/route.ts',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...apiRoutes),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          
          // Check if file exists
          if (!fs.existsSync(fullPath)) {
            return true; // Skip if file doesn't exist
          }

          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: API routes must not use browser client
          const hasClientImport = fileContent.includes("from '@/lib/supabase/client'");
          expect(hasClientImport).toBe(false);

          // If the file uses createClient, it must import from server
          if (fileContent.includes('createClient')) {
            const hasServerImport = fileContent.includes("from '@/lib/supabase/server'") || 
                                   fileContent.includes('from "@/lib/supabase/server"');
            expect(hasServerImport).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify no service files directly instantiate browser client', () => {
    const serviceFiles = fs.readdirSync(path.join(process.cwd(), 'lib/db/services'))
      .filter(file => file.endsWith('.service.ts'));

    fc.assert(
      fc.property(
        fc.constantFrom(...serviceFiles),
        (fileName) => {
          const filePath = path.join(process.cwd(), 'lib/db/services', fileName);
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Service files should not import or create browser client
          const hasClientImport = fileContent.includes("from '@/lib/supabase/client'");
          const hasCreateBrowserClient = fileContent.includes('createBrowserClient');

          expect(hasClientImport).toBe(false);
          expect(hasCreateBrowserClient).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
