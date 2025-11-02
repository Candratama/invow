'use client'

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Invoice, PendingRequest } from './types'
import { logger } from './utils/logger'

interface InvoiceDB extends DBSchema {
  drafts: {
    key: string
    value: Invoice
    indexes: { 'by-date': Date }
  }
  pendingRequests: {
    key: string
    value: PendingRequest
    indexes: { 'by-timestamp': Date }
  }
}

const DB_NAME = 'invoice-generator-db'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<InvoiceDB> | null = null

async function getDB(): Promise<IDBPDatabase<InvoiceDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<InvoiceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create drafts store
      if (!db.objectStoreNames.contains('drafts')) {
        const draftStore = db.createObjectStore('drafts', { keyPath: 'id' })
        draftStore.createIndex('by-date', 'updatedAt')
      }

      // Create pending requests store
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const requestStore = db.createObjectStore('pendingRequests', { keyPath: 'id' })
        requestStore.createIndex('by-timestamp', 'timestamp')
      }
    },
  })

  return dbInstance
}

// Draft Invoice Operations
export async function saveDraftToIndexedDB(invoice: Invoice): Promise<void> {
  const db = await getDB()
  await db.put('drafts', invoice)
  logger.debug("Draft saved to IndexedDB")
}

export async function getDraftFromIndexedDB(id: string): Promise<Invoice | undefined> {
  const db = await getDB()
  return await db.get('drafts', id)
}

export async function getAllDraftsFromIndexedDB(): Promise<Invoice[]> {
  const db = await getDB()
  return await db.getAll('drafts')
}

export async function deleteDraftFromIndexedDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('drafts', id)
  logger.debug("Draft deleted from IndexedDB")
}

// Pending Request Operations (for offline queue)
export async function addPendingRequest(request: PendingRequest): Promise<void> {
  const db = await getDB()
  await db.put('pendingRequests', request)
  logger.debug("Request queued for sync")
}

export async function getPendingRequest(id: string): Promise<PendingRequest | undefined> {
  const db = await getDB()
  return await db.get('pendingRequests', id)
}

export async function getAllPendingRequests(): Promise<PendingRequest[]> {
  const db = await getDB()
  return await db.getAll('pendingRequests')
}

export async function deletePendingRequest(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('pendingRequests', id)
  logger.debug("Request synced and removed")
}

// Sync pending requests when online
export async function syncPendingRequests(): Promise<number> {
  const requests = await getAllPendingRequests()
  let syncedCount = 0

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.body),
      })

      if (response.ok) {
        await deletePendingRequest(request.id)
        syncedCount++
      } else {
        // Increment retry count
        request.retryCount++
        if (request.retryCount > 3) {
          // Max retries reached, delete the request
          await deletePendingRequest(request.id)
          logger.error("Max retries reached for sync request")
        } else {
          await addPendingRequest(request)
        }
      }
    } catch (error) {
      logger.error("Error syncing request", error)
      // Keep in queue for next sync attempt
    }
  }

  logger.debug(`Synced ${syncedCount} of ${requests.length} pending requests`)
  return syncedCount
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('drafts')
  await db.clear('pendingRequests')
  console.log('🧹 All IndexedDB data cleared')
}