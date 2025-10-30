/**
 * Date Utilities for handling date serialization/deserialization
 * Handles Date objects and ISO string dates from localStorage
 */

/**
 * Safely convert a date value to ISO string
 * Handles Date objects, ISO strings, and timestamps
 */
export function toISOString(date: Date | string | number): string {
  if (date instanceof Date) {
    return date.toISOString()
  }

  if (typeof date === 'string') {
    // Already an ISO string, validate and return
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${date}`)
    }
    return date
  }

  if (typeof date === 'number') {
    return new Date(date).toISOString()
  }

  throw new Error(`Invalid date type: ${typeof date}`)
}

/**
 * Safely convert a date value to Date object
 * Handles Date objects, ISO strings, and timestamps
 */
export function toDate(date: Date | string | number | undefined | null): Date {
  if (date === undefined || date === null) {
    return new Date()
  }

  if (date instanceof Date) {
    return date
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      console.error(`Invalid date value: ${date}`)
      return new Date()
    }
    return parsed
  }

  console.error(`Invalid date type: ${typeof date}`)
  return new Date()
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(date: unknown): boolean {
  if (date instanceof Date) {
    return !isNaN(date.getTime())
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }

  return false
}
