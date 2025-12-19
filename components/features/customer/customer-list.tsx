"use client";

import { User, Phone, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/db/database.types";

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  isDeleting?: string;
  className?: string;
}

/**
 * CustomerList Component
 * Displays customers in a card format with edit/delete actions
 * Requirements: 4.1, 4.2, 4.3
 */
export function CustomerList({
  customers,
  onEdit,
  onDelete,
  isDeleting,
  className,
}: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No customers yet
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Add your first customer to get started. Customers can be selected when
          creating invoices.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onEdit={() => onEdit(customer)}
          onDelete={() => onDelete(customer.id)}
          isDeleting={isDeleting === customer.id}
        />
      ))}
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function CustomerCard({
  customer,
  onEdit,
  onDelete,
  isDeleting,
}: CustomerCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name and Status */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <h3 className="font-medium text-gray-900 truncate">
              {customer.name}
            </h3>
            {customer.status && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {customer.status}
              </span>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">{customer.phone}</p>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 line-clamp-2">
              {customer.address}
            </p>
          </div>

          {/* Email (if exists) */}
          {customer.email && (
            <p className="text-xs text-gray-400 pl-6">{customer.email}</p>
          )}

          {/* Notes (if exists) */}
          {customer.notes && (
            <p className="text-xs text-gray-400 pl-6 italic line-clamp-1">
              Note: {customer.notes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
            title="Edit customer"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Delete customer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
