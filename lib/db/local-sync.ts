/**
 * Local Storage to Supabase Sync
 * Handles syncing local data when user creates an account
 */

import { useInvoiceStore } from "@/lib/store";
import { storesService, storeContactsService } from "./services";

/**
 * Sync all local data to Supabase for a new user
 * This should be called after successful signup
 */
export async function syncLocalDataToSupabase(): Promise<{
  success: boolean;
  syncedSettings: boolean;
  syncedInvoices: number;
  errors: string[];
}> {
  console.log("🔄 Starting sync of local data to Supabase...");

  const results = {
    success: true,
    syncedSettings: false,
    syncedInvoices: 0,
    errors: [] as string[],
  };

  try {
    // Verify user is authenticated before starting
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      console.error("❌ Cannot sync: User not authenticated");
      throw new Error(
        "User not authenticated. Please ensure you are logged in before syncing.",
      );
    }

    console.log("✅ User authenticated:", currentUser.email);

    // Get all local data from Zustand store
    const store = useInvoiceStore.getState();

    // Sync settings first - create default store
    if (store.storeSettings) {
      try {
        // Check if store already exists
        const { data: existingStore } = await storesService.getDefaultStore();

        if (existingStore) {
          // Update existing store (without admin fields)
          const { error: storeError } = await storesService.updateStore(
            existingStore.id,
            {
              name: store.storeSettings.name,
              logo: store.storeSettings.logo || null,
              address: store.storeSettings.address,
              whatsapp: store.storeSettings.whatsapp,
              store_description: store.storeSettings.storeDescription || null,
              tagline: store.storeSettings.tagline || null,
              store_number: store.storeSettings.storeNumber || null,
              payment_method: store.storeSettings.paymentMethod || null,
              email: store.storeSettings.email || null,
              brand_color: store.storeSettings.brandColor,
            },
          );

          if (storeError) {
            results.errors.push(`Failed to update store: ${storeError.message}`);
          } else {
            results.syncedSettings = true;
            console.log("✅ Store updated in Supabase");

            // Update or create primary contact if admin info exists
            if (store.storeSettings.adminName) {
              const { data: primaryContact } =
                await storeContactsService.getPrimaryContact(existingStore.id);

              if (primaryContact) {
                // Update existing primary contact
                const { error: contactError } =
                  await storeContactsService.updateContact(primaryContact.id, {
                    name: store.storeSettings.adminName,
                    title: store.storeSettings.adminTitle || null,
                    signature: store.storeSettings.signature || null,
                  });

                if (contactError) {
                  console.warn(
                    "⚠️ Failed to update primary contact:",
                    contactError.message,
                  );
                } else {
                  console.log("✅ Primary contact updated");
                }
              } else {
                // Create new primary contact
                const { error: contactError } =
                  await storeContactsService.createContact({
                    store_id: existingStore.id,
                    name: store.storeSettings.adminName,
                    title: store.storeSettings.adminTitle || null,
                    signature: store.storeSettings.signature || null,
                    is_primary: true,
                  });

                if (contactError) {
                  console.warn(
                    "⚠️ Failed to create primary contact:",
                    contactError.message,
                  );
                } else {
                  console.log("✅ Primary contact created");
                }
              }
            }
          }
        } else {
          // Create new default store
          const { data: newStore, error: storeError } =
            await storesService.createDefaultStoreFromSettings(
              store.storeSettings,
            );

          if (storeError) {
            results.errors.push(`Failed to create store: ${storeError.message}`);
          } else {
            results.syncedSettings = true;
            console.log("✅ Store created in Supabase");

            // Create primary contact if admin info exists
            if (newStore && store.storeSettings.adminName) {
              const { error: contactError } =
                await storeContactsService.createContact({
                  store_id: newStore.id,
                  name: store.storeSettings.adminName,
                  title: store.storeSettings.adminTitle || null,
                  signature: store.storeSettings.signature || null,
                  is_primary: true,
                });

              if (contactError) {
                console.warn(
                  "⚠️ Failed to create primary contact:",
                  contactError.message,
                );
              } else {
                console.log("✅ Primary contact created");
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Store sync error: ${errorMessage}`);
      }
    } else {
      // No settings exist - create a minimal default store so invoices can be synced
      try {
        const { data: existingStore } = await storesService.getDefaultStore();

        if (!existingStore) {
          console.log(
            "⚠️ No store settings found locally, creating minimal default store",
          );
          const { data: newStore, error: storeError } =
            await storesService.createStore({
              name: "My Store",
              slug: "my-store",
              address: "Address not set",
              whatsapp: "+620000000000",
              brand_color: "#10b981",
              is_active: true,
              invoice_prefix: "INV",
              store_code: "STORE",
            });

          if (storeError) {
            results.errors.push(
              `Failed to create minimal store: ${storeError.message}`,
            );
          } else {
            results.syncedSettings = true;
            console.log("✅ Minimal default store created");

            // Create a default primary contact
            if (newStore) {
              const { error: contactError } =
                await storeContactsService.createContact({
                  store_id: newStore.id,
                  name: "Admin",
                  title: "Owner",
                  signature: null,
                  is_primary: true,
                });

              if (contactError) {
                console.warn(
                  "⚠️ Failed to create default contact:",
                  contactError.message,
                );
              } else {
                console.log("✅ Default contact created");
              }
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Default store creation error: ${errorMessage}`);
      }
    }

    // Sync all completed invoices
    const allInvoices = [...store.completedInvoices];

    for (const invoice of allInvoices) {
      try {
        // Sync invoice to database
        const { SyncService } = await import("./sync");
        const { error } = await SyncService.syncInvoiceToDb(invoice);

        if (error) {
          results.errors.push(
            `Failed to sync invoice ${invoice.invoiceNumber}: ${error.message}`,
          );
        } else {
          results.syncedInvoices++;
          console.log(`✅ Invoice ${invoice.invoiceNumber} synced to Supabase`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(
          `Invoice ${invoice.invoiceNumber} sync error: ${errorMessage}`,
        );
      }
    }

    // Clear local sync queue since we've synced everything
    try {
      const { syncQueueManager } = await import("./sync-queue");
      await syncQueueManager.clear();
      console.log("✅ Sync queue cleared");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.errors.push(`Failed to clear sync queue: ${errorMessage}`);
    }

    if (results.errors.length > 0) {
      results.success = false;
      console.warn("⚠️ Some sync operations failed:", results.errors);
    } else {
      console.log("🎉 All local data synced successfully to Supabase");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Sync process error: ${errorMessage}`);
    results.success = false;
  }

  return results;
}

/**
 * Check if there's local data to sync
 */
export function hasLocalDataToSync(): boolean {
  const store = useInvoiceStore.getState();
  return !!(
    store.storeSettings ||
    store.completedInvoices.length > 0
  );
}

/**
 * Get summary of local data for syncing
 */
export function getLocalDataSummary(): {
  hasSettings: boolean;
  draftCount: number;
  completedCount: number;
  totalInvoices: number;
} {
  const store = useInvoiceStore.getState();
  return {
    hasSettings: !!store.storeSettings,
    draftCount: 0, // No more drafts
    completedCount: store.completedInvoices.length,
    totalInvoices: store.completedInvoices.length,
  };
}
