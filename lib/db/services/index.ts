/**
 * Database Services Index
 * Central export point for all database services
 */

export { SettingsService, settingsService } from './settings.service'
export { InvoicesService, invoicesService } from './invoices.service'
export { ItemsService, itemsService } from './items.service'

// Re-export types for convenience
export type { InvoiceWithItems } from './invoices.service'
