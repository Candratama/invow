/**
 * Invoice Calculation Service
 * Handles tax calculations and total computation for invoices
 */

export interface TaxCalculation {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
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
    ? Math.round((subtotal * taxPercentage) / 100 * 100) / 100  // Round to 2 decimal places
    : 0;

  // Calculate final total: subtotal + shipping + tax
  const total = Math.round((subtotal + shippingCost + taxAmount) * 100) / 100;  // Round to 2 decimal places

  return {
    subtotal: Math.round(subtotal * 100) / 100,  // Ensure subtotal is also rounded
    shippingCost: Math.round(shippingCost * 100) / 100,  // Ensure shipping is also rounded
    taxAmount,
    total,
  };
}
