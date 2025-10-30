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

  async init(): Promise<void> {
    if (this.db) return;

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
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction("sync-queue", "readonly");
    const items = await tx
      .objectStore("sync-queue")
      .index("by-timestamp")
      .getAll(null, 1);

    return items[0] || null;
  }

  /**
   * Get all items in queue
   */
  async getAll(): Promise<SyncQueueItem[]> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.getAll("sync-queue");
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
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return await this.db.count("sync-queue");
  }
}

// Export singleton instance
export const syncQueueManager = new SyncQueueManager();
