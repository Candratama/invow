"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  User,
  ChevronDown,
  X,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import type { Customer, CustomerInsert } from "@/lib/db/database.types";

interface CustomerSelectorProps {
  storeId: string;
  onSelect: (customer: Customer | null) => void;
  onCreateNew: (customerData: CustomerInsert) => Promise<Customer | null>;
  selectedCustomerId?: string;
  className?: string;
  /** Whether the selector is disabled (for free users) */
  disabled?: boolean;
  /** Whether the user has premium access */
  isPremium?: boolean;
  /** Callback when disabled selector is clicked (to open upgrade modal) */
  onUpgradeClick?: () => void;
}

/**
 * CustomerSelector Component
 * Searchable dropdown for selecting existing customers or adding new ones
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3
 */
export function CustomerSelector({
  storeId,
  onSelect,
  onCreateNew,
  selectedCustomerId,
  className,
  disabled = false,
  isPremium: _isPremium = true, // Used by parent for context, disabled controls behavior
  onUpgradeClick,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch customers on mount and when search changes
  const fetchCustomers = useCallback(
    async (query: string) => {
      if (!storeId) return;

      setIsLoading(true);
      try {
        const { searchCustomersAction, getCustomersAction } = await import(
          "@/app/actions/customers"
        );

        const result = query.trim()
          ? await searchCustomersAction(storeId, query)
          : await getCustomersAction(storeId);

        if (result.success && result.data) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [storeId]
  );

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    fetchCustomers(query);
  }, 300);

  // Prefetch customers on mount (so data is ready when dropdown opens)
  useEffect(() => {
    if (storeId && !disabled) {
      fetchCustomers("");
    }
  }, [storeId, disabled, fetchCustomers]);

  // Refetch when dropdown opens with search query
  useEffect(() => {
    if (isOpen && searchQuery) {
      fetchCustomers(searchQuery);
    }
  }, [isOpen, searchQuery, fetchCustomers]);

  // Sync selected customer with parent's selectedCustomerId prop
  useEffect(() => {
    const syncSelectedCustomer = async () => {
      // Clear selection if parent cleared it
      if (!selectedCustomerId && selectedCustomer) {
        setSelectedCustomer(null);
        return;
      }

      // Load customer if ID provided and not already loaded
      if (selectedCustomerId && selectedCustomer?.id !== selectedCustomerId) {
        try {
          const { getCustomerAction } = await import("@/app/actions/customers");
          const result = await getCustomerAction(selectedCustomerId);
          if (result.success && result.data) {
            setSelectedCustomer(result.data);
          }
        } catch (error) {
          console.error("Failed to load selected customer:", error);
        }
      }
    };
    syncSelectedCustomer();
  }, [selectedCustomerId, selectedCustomer]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onSelect(customer);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    onSelect(null);
  };

  const handleAddNewClick = () => {
    setShowAddForm(true);
  };

  const handleCustomerCreated = async (customer: Customer) => {
    setSelectedCustomer(customer);
    onSelect(customer);
    setShowAddForm(false);
    setIsOpen(false);
    setSearchQuery("");
    // Refresh customer list
    await fetchCustomers("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Selected Customer Display or Trigger */}
      {selectedCustomer ? (
        <div className="flex items-start gap-3 p-3 border rounded-md bg-gray-50">
          <User className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{selectedCustomer.name}</p>
              {selectedCustomer.status && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                  {selectedCustomer.status}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
            {selectedCustomer.address && (
              <p className="text-xs text-gray-500">
                {selectedCustomer.address}
              </p>
            )}
            {selectedCustomer.email && (
              <p className="text-xs text-gray-400">{selectedCustomer.email}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : disabled ? (
        /* Disabled state for free users - shows premium badge */
        <button
          type="button"
          onClick={onUpgradeClick}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-gray-50 px-3 py-2 text-base ring-offset-background",
            "cursor-pointer hover:bg-gray-100 transition-colors"
          )}
        >
          <span className="text-muted-foreground">Select a customer...</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
            <Lock className="w-3 h-3" />
            Premium
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className="text-muted-foreground">Select a customer...</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      )}

      {/* Dropdown - only show when not disabled */}
      {isOpen && !showAddForm && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : customers.length > 0 ? (
              <ul className="py-1">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{customer.name}</p>
                        {customer.status && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                            {customer.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                      {customer.address && (
                        <p className="text-xs text-gray-400 truncate">
                          {customer.address}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                {searchQuery ? "No customers found" : "No customers yet"}
              </div>
            )}
          </div>

          {/* Add New Customer Button */}
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleAddNewClick}
            >
              <Plus className="h-4 w-4" />
              Add New Customer
            </Button>
          </div>
        </div>
      )}

      {/* Inline Add Form - only show when not disabled */}
      {showAddForm && !disabled && (
        <InlineCustomerForm
          storeId={storeId}
          onSave={handleCustomerCreated}
          onCancel={() => setShowAddForm(false)}
          onCreateNew={onCreateNew}
        />
      )}
    </div>
  );
}

/**
 * InlineCustomerForm Component
 * Compact form for quickly adding a new customer
 * Requirements: 1.1, 1.2, 6.4
 */
interface InlineCustomerFormProps {
  storeId: string;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  onCreateNew: (customerData: CustomerInsert) => Promise<Customer | null>;
}

function InlineCustomerForm({
  storeId,
  onSave,
  onCancel,
  onCreateNew,
}: InlineCustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"Customer" | "Reseller" | "Distributor">(
    "Customer"
  );
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Name validation (min 2 chars)
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone validation (Indonesian format: 8-15 digits, optional + prefix)
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      newErrors.phone =
        "Invalid phone format. Use 8-15 digits, optional + prefix";
    }

    // Address validation (min 5 chars)
    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const customerData: CustomerInsert = {
        store_id: storeId,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        status,
      };

      const newCustomer = await onCreateNew(customerData);
      if (newCustomer) {
        onSave(newCustomer);
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      setErrors({ name: "Failed to save customer. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h4 className="font-medium text-sm mb-3">Add New Customer</h4>

        {/* Name Field */}
        <div>
          <label className="text-sm font-medium mb-1 block">Name *</label>
          <Input
            type="text"
            placeholder="Customer name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name)
                setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={cn(errors.name && "border-red-500")}
            autoFocus
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label className="text-sm font-medium mb-1 block">Phone *</label>
          <Input
            type="tel"
            placeholder="e.g., 08123456789"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone)
                setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            className={cn(errors.phone && "border-red-500")}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Status Field */}
        <div>
          <label className="text-sm font-medium mb-1 block">Status *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="Customer">Customer</option>
            <option value="Reseller">Reseller</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>

        {/* Address Field */}
        <div>
          <label className="text-sm font-medium mb-1 block">Address *</label>
          <Input
            type="text"
            placeholder="Full address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (errors.address)
                setErrors((prev) => ({ ...prev, address: undefined }));
            }}
            className={cn(errors.address && "border-red-500")}
          />
          {errors.address && (
            <p className="text-xs text-red-500 mt-1">{errors.address}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              "Save Customer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
