/**
 * Database Services Index
 * Central export point for all database services
 */

export { SettingsService } from './settings.service'
export { StoresService } from './stores.service'
export { StoreContactsService } from './store-contacts.service'
export { UserPreferencesService } from './user-preferences.service'
export { InvoicesService } from './invoices.service'
export { ItemsService } from './items.service'
export { MayarPaymentService } from './mayar-payment.service'
export { SubscriptionService } from './subscription.service'
export { InvoiceCounterService } from './invoice-counter.service'

// Re-export types for convenience
export type { InvoiceWithItems } from './invoices.service'
export type { Store, StoreInsert } from './stores.service'
