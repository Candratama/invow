"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  customerSchema,
  type CustomerFormData,
} from "@/lib/validations/customer";
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
} from "@/lib/db/database.types";

interface CustomerFormProps {
  customer?: Customer;
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerInsert | CustomerUpdate) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * CustomerForm Component
 * Dialog form for creating/editing customers
 * Requirements: 1.2, 4.2, 6.4
 */
export function CustomerForm({
  customer,
  storeId,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CustomerFormProps) {
  const isEditMode = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      email: customer?.email || "",
      notes: customer?.notes || "",
      status: customer?.status || "Customer",
    },
  });

  // Reset form when customer changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: customer?.name || "",
        phone: customer?.phone || "",
        address: customer?.address || "",
        email: customer?.email || "",
        notes: customer?.notes || "",
        status: customer?.status || "Customer",
      });
    }
  }, [customer, open, reset]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    if (isEditMode) {
      await onSubmit(data as CustomerUpdate);
    } else {
      await onSubmit({
        ...data,
        store_id: storeId,
      } as CustomerInsert);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Customer name"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 08123456789"
              {...register("phone")}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="Customer">Customer</option>
              <option value="Reseller">Reseller</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              placeholder="Full address"
              rows={2}
              {...register("address")}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes about this customer"
              rows={2}
              {...register("notes")}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
