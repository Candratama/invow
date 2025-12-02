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
export { TierService } from './tier.service'
export { MonthlyReportService } from './monthly-report.service'
export { isAdmin, getAdminUser } from './admin.service'

// Re-export types for convenience
export type { InvoiceWithItems } from './invoices.service'
export type { Store, StoreInsert } from './stores.service'
export type { FeatureName, HistoryLimit } from './tier.service'
export type { MonthlyReportSummary, DailyInvoiceData, CustomerSummary } from './monthly-report.service'
