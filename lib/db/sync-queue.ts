/**
 * Sync Queue Manager
 * Manages offline sync queue using IndexedDB
 */

import { openDB, type IDBPDatabase } from "idb";

export type SyncAction = "create" | "update" | "upsert" | "delete";
export type EntityType = "settings" | "invoice" | "invoice_item";

export interface SyncQueueItem {
  id?: number;
  action: SyncAction;
  entityType: EntityType;
  entityId: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

interface SyncDB {
  "sync-queue": {
    key: number;
    value: SyncQueueItem;
    indexes: { "by-timestamp": number };
  };
}

export class SyncQueueManager {
  private db: IDBPDatabase<SyncDB> | null = null;
  private isInitializing = false;

  async init(): Promise<void> {
    // If already initialized and connection is valid, return
    if (this.db) {
      try {
        // Quick check if connection is still valid
        await this.db.count("sync-queue");
        return;
      } catch (error) {
        // Connection is invalid, reset and reinitialize
        console.warn("IndexedDB connection invalid, reinitializing...", error);
        this.db = null;
      }
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      // Wait for ongoing initialization
      let retries = 0;
      while (this.isInitializing && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      if (this.db) return;
    }

    try {
      this.isInitializing = true;
      this.db = await openDB<SyncDB>("invow-sync", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("sync-queue")) {
            const store = db.createObjectStore("sync-queue", {
              keyPath: "id",
              autoIncrement: true,
            });
            store.createIndex("by-timestamp", "timestamp");
          }
        },
      });
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Safely execute a database operation with error handling
   */
  private async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      await this.init();
      if (!this.db) return fallback;
      return await operation();
    } catch (error) {
      // Check if it's a connection closing error
      if (error instanceof Error && error.message.includes("closing")) {
        console.warn("Database connection closing, resetting...", error);
        this.db = null;
        // Retry once
        try {
          await this.init();
          if (this.db) {
            return await operation();
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }
      console.error("Database operation failed:", error);
      return fallback;
    }
  }

  /**
   * Add item to sync queue
   */
  async enqueue(
    item: Omit<SyncQueueItem, "id" | "timestamp" | "retryCount">,
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const queueItem: Omit<SyncQueueItem, "id"> = {
      ...item,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db.add("sync-queue", queueItem as SyncQueueItem);
  }

  /**
   * Get and remove next item from queue
   */
  async dequeue(): Promise<SyncQueueItem | null> {
    return await this.safeExecute(
      async () => {
        if (!this.db) return null;
        const tx = this.db.transaction("sync-queue", "readonly");
        const items = await tx
          .objectStore("sync-queue")
          .index("by-timestamp")
          .getAll(null, 1);
        return items[0] || null;
      },
      null,
    );
  }

  /**
   * Get all items in queue
   */
  async getAll(): Promise<SyncQueueItem[]> {
    return await this.safeExecute(
      async () => {
        if (!this.db) return [];
        return await this.db.getAll("sync-queue");
      },
      [],
    );
  }

  /**
   * Update retry count and error for an item
   */
  async updateRetry(id: number, error: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction("sync-queue", "readwrite");
    const item = await tx.objectStore("sync-queue").get(id);

    if (item) {
      item.retryCount++;
      item.lastError = error;
      await tx.objectStore("sync-queue").put(item);
    }

    await tx.done;
  }

  /**
   * Remove item from queue
   */
  async remove(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    await this.db.delete("sync-queue", id);
  }

  /**
   * Clear all items from queue
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction("sync-queue", "readwrite");
    await tx.objectStore("sync-queue").clear();
    await tx.done;
  }

  /**
   * Get count of items in queue
   */
  async getCount(): Promise<number> {
    return await this.safeExecute(
      async () => {
        if (!this.db) return 0;
        return await this.db.count("sync-queue");
      },
      0, // Return 0 if operation fails
    );
  }
}

// Export singleton instance
export const syncQueueManager = new SyncQueueManager();
