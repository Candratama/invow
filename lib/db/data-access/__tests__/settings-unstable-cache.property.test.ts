/**
 * Property-Based Test: Data access layer uses unstable_cache
 * 
 * **Feature: refactor-account-to-settings, Property 1: Data access layer uses unstable_cache**
 * 
 * **Validates: Requirements 2.1**
 * 
 * Property: For any data fetching function in settings data-access layer, 
 * the function SHALL use unstable_cache wrapper with appropriate cache tags.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 1: Data access layer uses unstable_cache', () => {
  const settingsFilePath = path.join(process.cwd(), 'lib/db/data-access/settings.ts');

  it('should verify settings.ts uses unstable_cache from next/cache', () => {
    fc.assert(
      fc.property(
        fc.constant(settingsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must import unstable_cache from next/cache
          const hasUnstableCacheImport = fileContent.includes("import { unstable_cache }") ||
                                          fileContent.includes("import {unstable_cache}") ||
                                          fileContent.includes("unstable_cache } from 'next/cache'") ||
                                          fileContent.includes('unstable_cache } from "next/cache"');

          expect(hasUnstableCacheImport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings.ts defines SETTINGS_CACHE_TAGS constant', () => {
    fc.assert(
      fc.property(
        fc.constant(settingsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must define SETTINGS_CACHE_TAGS constant
          const hasCacheTagsConstant = fileContent.includes('SETTINGS_CACHE_TAGS');
          expect(hasCacheTagsConstant).toBe(true);

          // Property: Must have required cache tags
          const hasStoreTag = fileContent.includes("store: 'settings-store'") ||
                              fileContent.includes('store: "settings-store"');
          const hasContactsTag = fileContent.includes("contacts: 'settings-contacts'") ||
                                  fileContent.includes('contacts: "settings-contacts"');
          const hasSubscriptionTag = fileContent.includes("subscription: 'settings-subscription'") ||
                                      fileContent.includes('subscription: "settings-subscription"');
          const hasPreferencesTag = fileContent.includes("preferences: 'settings-preferences'") ||
                                     fileContent.includes('preferences: "settings-preferences"');

          expect(hasStoreTag).toBe(true);
          expect(hasContactsTag).toBe(true);
          expect(hasSubscriptionTag).toBe(true);
          expect(hasPreferencesTag).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings.ts uses unstable_cache with revalidate option', () => {
    fc.assert(
      fc.property(
        fc.constant(settingsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must use unstable_cache function call
          const hasUnstableCacheCall = fileContent.includes('unstable_cache(');
          expect(hasUnstableCacheCall).toBe(true);

          // Property: Must have revalidate option set
          const hasRevalidateOption = fileContent.includes('revalidate:') ||
                                       fileContent.includes('revalidate :');
          expect(hasRevalidateOption).toBe(true);

          // Property: Must have tags option set
          const hasTagsOption = fileContent.includes('tags:') || fileContent.includes('tags :');
          expect(hasTagsOption).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings.ts has server-only import', () => {
    fc.assert(
      fc.property(
        fc.constant(settingsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must have 'server-only' import for security
          const hasServerOnly = fileContent.includes("import 'server-only'") ||
                                 fileContent.includes('import "server-only"');
          expect(hasServerOnly).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings.ts exports getSettingsPageData function', () => {
    fc.assert(
      fc.property(
        fc.constant(settingsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must export getSettingsPageData function
          const hasGetSettingsPageData = fileContent.includes('export const getSettingsPageData') ||
                                          fileContent.includes('export async function getSettingsPageData');
          expect(hasGetSettingsPageData).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify cache revalidation time is set to 60 seconds', () => {
    fc.assert(
      fc.property(
        fc.constant(settingsFilePath),
        (filePath) => {
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          // Property: Must have CACHE_REVALIDATE constant set to 60
          const hasRevalidateConstant = fileContent.includes('CACHE_REVALIDATE = 60') ||
                                         fileContent.includes('CACHE_REVALIDATE= 60') ||
                                         fileContent.includes('CACHE_REVALIDATE =60');
          expect(hasRevalidateConstant).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
