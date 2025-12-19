import { z } from "zod";

/**
 * Indonesian phone number format validation
 * Accepts: 8-15 digits with optional + prefix
 * Examples: +628123456789, 08123456789, 628123456789
 */
const INDONESIAN_PHONE_REGEX = /^\+?[0-9]{8,15}$/;

/**
 * Customer status enum values
 */
export const CUSTOMER_STATUS_VALUES = ["Customer", "Reseller", "Distributor"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUS_VALUES)[number];

/**
 * Zod validation schema for customer data
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .transform((val) => val.trim()),
  phone: z
    .string()
    .regex(INDONESIAN_PHONE_REGEX, "Invalid phone number format. Use 8-15 digits, optional + prefix"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z
    .string()
    .optional()
    .nullable(),
  status: z
    .enum(CUSTOMER_STATUS_VALUES)
    .optional()
    .default("Customer"),
});

/**
 * Schema for creating a new customer (includes store_id)
 */
export const customerInsertSchema = customerSchema.extend({
  store_id: z.string().uuid("Invalid store ID"),
});

/**
 * Schema for updating an existing customer (all fields optional)
 */
export const customerUpdateSchema = customerSchema.partial().extend({
  is_active: z.boolean().optional(),
});

// Type exports inferred from schemas
export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerInsertData = z.infer<typeof customerInsertSchema>;
export type CustomerUpdateData = z.infer<typeof customerUpdateSchema>;

/**
 * Validate customer name
 * Returns error message if invalid, undefined if valid
 */
export function validateCustomerName(name: string): string | undefined {
  const result = customerSchema.shape.name.safeParse(name);
  if (!result.success) {
    return result.error.errors[0]?.message;
  }
  return undefined;
}

/**
 * Validate customer phone
 * Returns error message if invalid, undefined if valid
 */
export function validateCustomerPhone(phone: string): string | undefined {
  const result = customerSchema.shape.phone.safeParse(phone);
  if (!result.success) {
    return result.error.errors[0]?.message;
  }
  return undefined;
}

/**
 * Validate customer address
 * Returns error message if invalid, undefined if valid
 */
export function validateCustomerAddress(address: string): string | undefined {
  const result = customerSchema.shape.address.safeParse(address);
  if (!result.success) {
    return result.error.errors[0]?.message;
  }
  return undefined;
}

/**
 * Validate full customer data
 * Returns validation result with errors if any
 */
export function validateCustomer(data: unknown) {
  return customerSchema.safeParse(data);
}
