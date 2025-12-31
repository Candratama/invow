/**
 * Invoice Calculation Service
 * Handles tax calculations and total computation for invoices
 */

import { InvoiceItem } from "@/lib/types";

export interface TaxCalculation {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}

/**
 * Round to two decimal places
 */
function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate total for a single invoice item
 * Supports both regular items (quantity × price) and buyback items (gram × buyback_rate)
 */
export function calculateItemTotal(item: InvoiceItem, buybackRate?: number): number {
  if (item.is_buyback) {
    // Buyback: gram × buyback_rate
    const rate = item.buyback_rate || buybackRate || 0;
    return roundToTwoDecimals((item.gram || 0) * rate);
  } else {
    // Regular: quantity × price
    return roundToTwoDecimals((item.quantity || 0) * (item.price || 0));
  }
}

/**
 * Calculate invoice total with optional tax
 * 
 * @param subtotal - The subtotal amount before tax and shipping
 * @param shippingCost - The shipping cost
 * @param taxEnabled - Whether tax is enabled
 * @param taxPercentage - The tax percentage (0-100)
 * @returns TaxCalculation object with all calculated values
 */
export function calculateTotal(
  subtotal: number,
  shippingCost: number,
  taxEnabled: boolean,
  taxPercentage: number
): TaxCalculation {
  // Calculate tax amount: (subtotal × tax_percentage) / 100
  // If tax is disabled, tax amount is 0
  const taxAmount = taxEnabled
    ? roundToTwoDecimals((subtotal * taxPercentage) / 100)
    : 0;

  // Calculate final total: subtotal + shipping + tax
  const total = roundToTwoDecimals(subtotal + shippingCost + taxAmount);

  return {
    subtotal: roundToTwoDecimals(subtotal),
    shippingCost: roundToTwoDecimals(shippingCost),
    taxAmount,
    total,
  };
}
