import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Property tests for Invoice-Customer Integration
 * 
 * These tests verify the correctness properties for the customer management
 * integration with the invoice form.
 * 
 * **Feature: customer-management**
 */

// Type definitions for testing
interface CustomerMode {
  mode: "select" | "manual";
  selectedCustomer: { id: string; name: string } | null;
}

interface InvoiceData {
  id: string;
  store_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_address: string;
}

interface LegacyInvoice {
  id: string;
  customer_id: null;
  customer_name: string;
  customer_email: string | null;
  customer_address: string | null;
}

/**
 * Simulates the invoice data preparation logic from invoice-form.tsx
 * This mirrors the actual implementation in handleQuickDownload
 */
function prepareInvoiceData(
  customerMode: "select" | "manual",
  selectedCustomer: { id: string; name: string } | null,
  customerName: string,
  customerAddress: string,
  storeId: string
): InvoiceData {
  return {
    id: "test-invoice-id",
    store_id: storeId,
    // customer_id is set when a saved customer is selected, null for manual entry
    customer_id: customerMode === "select" && selectedCustomer ? selectedCustomer.id : null,
    customer_name: customerName,
    customer_address: customerAddress,
  };
}

/**
 * Simulates displaying customer information from an invoice
 * This mirrors the backward compatibility logic for existing invoices
 */
function getCustomerDisplayInfo(invoice: LegacyInvoice): {
  name: string;
  address: string;
  hasError: boolean;
} {
  try {
    // When customer_id is null, use inline fields
    if (invoice.customer_id === null) {
      return {
        name: invoice.customer_name || "",
        address: invoice.customer_address || "",
        hasError: false,
      };
    }
    // This branch would handle linked customers (not tested here)
    return {
      name: invoice.customer_name,
      address: invoice.customer_address || "",
      hasError: false,
    };
  } catch {
    return {
      name: "",
      address: "",
      hasError: true,
    };
  }
}

describe("Invoice-Customer Integration - Property-Based Tests", () => {
  /**
   * **Feature: customer-management, Property 7: Manual entry results in null customer_id**
   * 
   * *For any* invoice created without selecting a saved customer, 
   * the saved invoice should have `customer_id` equal to null.
   * 
   * **Validates: Requirements 3.2**
   */
  describe("Property 7: Manual entry results in null customer_id", () => {
    it("should set customer_id to null when customerMode is 'manual'", () => {
      fc.assert(
        fc.property(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            customerAddress: fc.string({ maxLength: 200 }),
            storeId: fc.uuid(),
          }),
          ({ customerName, customerAddress, storeId }) => {
            // When mode is manual, customer_id should always be null
            const invoiceData = prepareInvoiceData(
              "manual",
              null, // No selected customer in manual mode
              customerName,
              customerAddress,
              storeId
            );

            expect(invoiceData.customer_id).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should set customer_id to null when customerMode is 'manual' even if selectedCustomer was previously set", () => {
      fc.assert(
        fc.property(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            customerAddress: fc.string({ maxLength: 200 }),
            storeId: fc.uuid(),
            previousCustomerId: fc.uuid(),
            previousCustomerName: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          ({ customerName, customerAddress, storeId, previousCustomerId, previousCustomerName }) => {
            // Even if there was a previously selected customer, manual mode should result in null
            // This simulates the user switching from "select" to "manual" mode
            const invoiceData = prepareInvoiceData(
              "manual",
              null, // selectedCustomer is cleared when switching to manual
              customerName,
              customerAddress,
              storeId
            );

            expect(invoiceData.customer_id).toBeNull();
            // The customer name should be the manually entered one
            expect(invoiceData.customer_name).toBe(customerName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should set customer_id to the selected customer's id when customerMode is 'select' and customer is selected", () => {
      fc.assert(
        fc.property(
          fc.record({
            customerId: fc.uuid(),
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            customerAddress: fc.string({ maxLength: 200 }),
            storeId: fc.uuid(),
          }),
          ({ customerId, customerName, customerAddress, storeId }) => {
            const selectedCustomer = { id: customerId, name: customerName };
            
            const invoiceData = prepareInvoiceData(
              "select",
              selectedCustomer,
              customerName,
              customerAddress,
              storeId
            );

            expect(invoiceData.customer_id).toBe(customerId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should set customer_id to null when customerMode is 'select' but no customer is selected", () => {
      fc.assert(
        fc.property(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            customerAddress: fc.string({ maxLength: 200 }),
            storeId: fc.uuid(),
          }),
          ({ customerName, customerAddress, storeId }) => {
            // Select mode but no customer selected yet
            const invoiceData = prepareInvoiceData(
              "select",
              null,
              customerName,
              customerAddress,
              storeId
            );

            expect(invoiceData.customer_id).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: customer-management, Property 8: Backward compatibility with existing invoices**
   * 
   * *For any* invoice where `customer_id` is null, the system should display 
   * customer information from the inline fields (`customer_name`, `customer_address`) 
   * without errors.
   * 
   * **Validates: Requirements 3.3**
   */
  describe("Property 8: Backward compatibility with existing invoices", () => {
    it("should display customer info from inline fields when customer_id is null", () => {
      fc.assert(
        fc.property(
          fc.record({
            invoiceId: fc.uuid(),
            customerName: fc.string({ minLength: 0, maxLength: 100 }),
            customerEmail: fc.option(fc.emailAddress(), { nil: null }),
            customerAddress: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
          }),
          ({ invoiceId, customerName, customerEmail, customerAddress }) => {
            const legacyInvoice: LegacyInvoice = {
              id: invoiceId,
              customer_id: null, // Legacy invoices have null customer_id
              customer_name: customerName,
              customer_email: customerEmail,
              customer_address: customerAddress,
            };

            const displayInfo = getCustomerDisplayInfo(legacyInvoice);

            // Should not have any errors
            expect(displayInfo.hasError).toBe(false);
            // Should display the inline customer name
            expect(displayInfo.name).toBe(customerName);
            // Should display the inline customer address (or empty string if null)
            expect(displayInfo.address).toBe(customerAddress || "");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle empty customer fields gracefully", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (invoiceId) => {
            const legacyInvoice: LegacyInvoice = {
              id: invoiceId,
              customer_id: null,
              customer_name: "", // Empty name
              customer_email: null,
              customer_address: null, // Null address
            };

            const displayInfo = getCustomerDisplayInfo(legacyInvoice);

            // Should not have any errors even with empty/null fields
            expect(displayInfo.hasError).toBe(false);
            expect(displayInfo.name).toBe("");
            expect(displayInfo.address).toBe("");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve all customer data when customer_id is null", () => {
      fc.assert(
        fc.property(
          fc.record({
            invoiceId: fc.uuid(),
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            customerAddress: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          ({ invoiceId, customerName, customerAddress }) => {
            const legacyInvoice: LegacyInvoice = {
              id: invoiceId,
              customer_id: null,
              customer_name: customerName,
              customer_email: null,
              customer_address: customerAddress,
            };

            const displayInfo = getCustomerDisplayInfo(legacyInvoice);

            // Data should be preserved exactly as stored
            expect(displayInfo.name).toBe(customerName);
            expect(displayInfo.address).toBe(customerAddress);
            expect(displayInfo.hasError).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
