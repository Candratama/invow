/**
 * Database Services Index
 * Central export point for all database services
 */

export { SettingsService, settingsService } from './settings.service'
export { StoresService, storesService } from './stores.service'
export { StoreContactsService, storeContactsService } from './store-contacts.service'
export { UserPreferencesService, userPreferencesService } from './user-preferences.service'
export { InvoicesService, invoicesService } from './invoices.service'
export { ItemsService, itemsService } from './items.service'

// Re-export types for convenience
export type { InvoiceWithItems } from './invoices.service'
export type { Store, StoreInsert } from './stores.service'
