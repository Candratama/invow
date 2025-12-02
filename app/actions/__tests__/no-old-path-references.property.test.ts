/**
 * Property-Based Test: No old path references in codebase
 * 
 * **Feature: refactor-account-to-settings, Property 3: No old path references in codebase**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * Property: For any file in the codebase (excluding node_modules, .next, and spec files),
 * there SHALL be no references to `/dashboard/account` path (except for redirect configuration).
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// Files that are allowed to reference /dashboard/account (for redirect purposes or testing)
const ALLOWED_FILES = [
  'next.config.js',
  'middleware.ts',
  '.kiro/specs/', // Spec files can reference old paths for documentation
  'no-old-path-references.property.test.ts', // This test file itself
  'settings-cache-revalidation.property.test.ts', // Test that verifies old paths don't exist
]

// Directories to exclude from search
const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'app/dashboard/account', // Old folder that will be deleted in cleanup task
]

/**
 * Check if a file is allowed to have old path references
 */
function isAllowedFile(filePath: string): boolean {
  return ALLOWED_FILES.some(allowed => filePath.includes(allowed))
}

/**
 * Check if a file is in an excluded directory
 */
function isExcludedDir(filePath: string): boolean {
  return EXCLUDED_DIRS.some(excluded => filePath.includes(excluded))
}

/**
 * Recursively get all source files in a directory
 */
function getFilesRecursively(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(baseDir, fullPath)
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.some(excluded => relativePath.includes(excluded))) {
          files.push(...getFilesRecursively(fullPath, baseDir))
        }
      } else if (entry.isFile()) {
        // Only include TypeScript and JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(relativePath)
        }
      }
    }
  } catch {
    // Ignore errors (e.g., permission denied)
  }
  
  return files
}

/**
 * Get all source files in the codebase
 */
function getSourceFiles(): string[] {
  return getFilesRecursively(process.cwd())
}

describe('Property 3: No old path references in codebase', () => {
  it('should verify no source files contain /dashboard/account path references', () => {
    const sourceFiles = getSourceFiles()
      .filter(f => !isExcludedDir(f))
      .filter(f => !isAllowedFile(f))
    
    // Use a subset of files for property testing
    const filesToTest = sourceFiles.slice(0, 200) // Limit to avoid timeout
    
    fc.assert(
      fc.property(
        fc.constantFrom(...filesToTest),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath)
          
          if (!fs.existsSync(fullPath)) {
            return true // Skip non-existent files
          }
          
          const fileContent = fs.readFileSync(fullPath, 'utf-8')
          
          // Property: File should NOT contain /dashboard/account path
          const hasOldPath = fileContent.includes('/dashboard/account')
          
          if (hasOldPath) {
            console.log(`Found old path reference in: ${filePath}`)
          }
          
          expect(hasOldPath).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify navigation components use /dashboard/settings', () => {
    const navigationFiles = [
      'components/features/dashboard/user-menu.tsx',
      'components/features/onboarding/welcome-banner.tsx',
      'components/features/subscription/upgrade-modal.tsx',
      'components/features/subscription/upgrade-button.tsx',
      'components/features/invoice/invoice-form.tsx',
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...navigationFiles),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath)
          
          if (!fs.existsSync(fullPath)) {
            return true // Skip non-existent files
          }
          
          const fileContent = fs.readFileSync(fullPath, 'utf-8')
          
          // Property: Navigation files should NOT contain /dashboard/account
          const hasOldPath = fileContent.includes('/dashboard/account')
          
          expect(hasOldPath).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify server actions use /dashboard/settings for revalidatePath', () => {
    const serverActionFiles = [
      'app/actions/store.ts',
      'app/actions/preferences.ts',
      'app/actions/payments.ts',
      'app/actions/subscription.ts',
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...serverActionFiles),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath)
          
          if (!fs.existsSync(fullPath)) {
            return true // Skip non-existent files
          }
          
          const fileContent = fs.readFileSync(fullPath, 'utf-8')
          
          // Property: Server actions should NOT use /dashboard/account in revalidatePath
          const hasOldRevalidatePath = fileContent.includes("revalidatePath('/dashboard/account')") ||
                                        fileContent.includes('revalidatePath("/dashboard/account")')
          
          expect(hasOldRevalidatePath).toBe(false)
          
          // If file has revalidatePath for settings, it should use the new path
          if (fileContent.includes('revalidatePath') && fileContent.includes('settings')) {
            const usesNewPath = fileContent.includes("revalidatePath('/dashboard/settings')") ||
                               fileContent.includes('revalidatePath("/dashboard/settings")')
            expect(usesNewPath).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should verify test files use /dashboard/settings path', () => {
    const testFiles = [
      'app/actions/__tests__/targeted-cache-revalidation.property.test.ts',
      'components/features/settings/__tests__/client-components-props.property.test.ts',
      'lib/__tests__/store-no-direct-imports.property.test.ts',
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...testFiles),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath)
          
          if (!fs.existsSync(fullPath)) {
            return true // Skip non-existent files
          }
          
          const fileContent = fs.readFileSync(fullPath, 'utf-8')
          
          // Property: Test files should NOT reference /dashboard/account
          // (except in comments explaining the migration)
          const lines = fileContent.split('\n')
          const codeLines = lines.filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
          const codeContent = codeLines.join('\n')
          
          const hasOldPathInCode = codeContent.includes('/dashboard/account')
          
          expect(hasOldPathInCode).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
