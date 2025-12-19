'use server'

import { createClient } from '@/lib/supabase/server'
import { CustomersService } from '@/lib/db/services/customers.service'
import { SubscriptionService } from '@/lib/db/services/subscription.service'
import { customerInsertSchema, customerUpdateSchema } from '@/lib/validations/customer'
import { revalidatePath } from 'next/cache'
import type { CustomerInsert, CustomerUpdate, Customer } from '@/lib/db/database.types'

/**
 * Server Actions for Customer Management
 * Implements: Requirements 1.2, 2.3, 4.2, 4.3
 */

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Premium access validation helper
 * Checks if user has premium subscription tier for customer management access
 * @param userId - User ID to check
 * @returns Object with hasAccess boolean and optional error message
 * Requirements: 3.1, 3.2, 3.3
 */
export async function validatePremiumAccess(userId: string): Promise<{
  hasAccess: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const subscriptionService = new SubscriptionService(supabase)
    
    const { data: status, error } = await subscriptionService.getSubscriptionStatus(userId)
    
    if (error || !status) {
      return { 
        hasAccess: false, 
        error: 'Failed to verify subscription status' 
      }
    }
    
    // Only premium tier has access to customer management
    if (status.tier !== 'premium') {
      return { 
        hasAccess: false, 
        error: 'This feature requires a premium subscription' 
      }
    }
    
    return { hasAccess: true }
  } catch (error) {
    console.error('Premium access validation error:', error)
    return { 
      hasAccess: false, 
      error: 'Failed to verify subscription status' 
    }
  }
}

/**
 * Get all active customers for a store
 * @param storeId - Store ID to filter customers
 * @returns Array of active customers
 * Requirements: 2.1, 4.1, 3.1, 3.2
 */
export async function getCustomersAction(storeId: string): Promise<ActionResult<Customer[]>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check premium access
    const premiumCheck = await validatePremiumAccess(user.id)
    if (!premiumCheck.hasAccess) {
      return { success: false, error: premiumCheck.error }
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, error: 'Store not found or access denied' }
    }

    const service = new CustomersService(supabase)
    const result = await service.getCustomers(storeId)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Get customers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Search customers by name (case-insensitive)
 * @param storeId - Store ID to filter customers
 * @param query - Search query string
 * @returns Array of matching customers
 * Requirements: 2.3, 3.1, 3.2
 */
export async function searchCustomersAction(
  storeId: string,
  query: string
): Promise<ActionResult<Customer[]>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check premium access
    const premiumCheck = await validatePremiumAccess(user.id)
    if (!premiumCheck.hasAccess) {
      return { success: false, error: premiumCheck.error }
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, error: 'Store not found or access denied' }
    }

    const service = new CustomersService(supabase)
    const result = await service.searchCustomers(storeId, query)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Search customers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a new customer
 * @param data - Customer data to insert
 * @returns Created customer
 * Requirements: 1.2, 1.5, 3.1, 3.2
 */
export async function createCustomerAction(
  data: CustomerInsert
): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check premium access
    const premiumCheck = await validatePremiumAccess(user.id)
    if (!premiumCheck.hasAccess) {
      return { success: false, error: premiumCheck.error }
    }

    // Validate input data
    const validationResult = customerInsertSchema.safeParse(data)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ')
      return { success: false, error: errors }
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', data.store_id)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, error: 'Store not found or access denied' }
    }

    const service = new CustomersService(supabase)
    const result = await service.createCustomer(validationResult.data)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Revalidate customer-related paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')

    return { success: true, data: result.data! }
  } catch (error) {
    console.error('Create customer error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update an existing customer
 * @param id - Customer ID
 * @param data - Customer data to update
 * @returns Updated customer
 * Requirements: 4.2, 3.1, 3.2
 */
export async function updateCustomerAction(
  id: string,
  data: CustomerUpdate
): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check premium access
    const premiumCheck = await validatePremiumAccess(user.id)
    if (!premiumCheck.hasAccess) {
      return { success: false, error: premiumCheck.error }
    }

    // Validate input data
    const validationResult = customerUpdateSchema.safeParse(data)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ')
      return { success: false, error: errors }
    }

    // Verify user owns the customer's store via RLS
    // First get the customer to check store ownership
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('store_id')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found' }
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', customer.store_id)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, error: 'Access denied' }
    }

    const service = new CustomersService(supabase)
    const result = await service.updateCustomer(id, validationResult.data)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Revalidate customer-related paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')

    return { success: true, data: result.data! }
  } catch (error) {
    console.error('Update customer error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Soft delete a customer (set is_active to false)
 * @param id - Customer ID
 * @returns Success status
 * Requirements: 4.3, 3.1, 3.2
 */
export async function deleteCustomerAction(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check premium access
    const premiumCheck = await validatePremiumAccess(user.id)
    if (!premiumCheck.hasAccess) {
      return { success: false, error: premiumCheck.error }
    }

    // Verify user owns the customer's store
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('store_id')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found' }
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', customer.store_id)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, error: 'Access denied' }
    }

    const service = new CustomersService(supabase)
    const result = await service.deleteCustomer(id)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // Revalidate customer-related paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')

    return { success: true }
  } catch (error) {
    console.error('Delete customer error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get a single customer by ID
 * @param id - Customer ID
 * @returns Customer or null if not found
 * Requirements: 2.2, 3.1, 3.2
 */
export async function getCustomerAction(id: string): Promise<ActionResult<Customer | null>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check premium access
    const premiumCheck = await validatePremiumAccess(user.id)
    if (!premiumCheck.hasAccess) {
      return { success: false, error: premiumCheck.error }
    }

    const service = new CustomersService(supabase)
    const result = await service.getCustomer(id)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    // If customer found, verify user owns the store
    if (result.data) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', result.data.store_id)
        .eq('user_id', user.id)
        .single()

      if (storeError || !store) {
        return { success: false, error: 'Access denied' }
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Get customer error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}


/**
 * Check if user has any existing customers (active or inactive)
 * This action works for both free and premium users
 * Used to show data preservation message on locked page
 * @param storeId - Store ID to check
 * @returns Boolean indicating if customers exist
 * Requirements: 5.3
 */
export async function hasExistingCustomersAction(storeId: string): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return { success: false, error: 'Store not found or access denied' }
    }

    // Check if any customers exist (including inactive ones)
    // Note: No premium check here - this is intentional for data preservation message
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    if (countError) {
      return { success: false, error: countError.message }
    }

    return { success: true, data: (count ?? 0) > 0 }
  } catch (error) {
    console.error('Check existing customers error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
