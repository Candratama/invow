"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerList, CustomerForm } from "@/components/features/customer";
import { CustomersLocked } from "@/components/features/customer/customers-locked";
import { CustomersSkeleton } from "@/components/skeletons/customers-skeleton";
import { toast } from "sonner";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { usePremiumStatus } from "@/lib/hooks/use-premium-status";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/lib/hooks/use-customers-data";
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
} from "@/lib/db/database.types";

interface CustomersClientProps {
  initialStoreId: string | null;
}

/**
 * CustomersClient Component
 * Main client component for customer management page
 * Requirements: 4.1
 */
export function CustomersClient({ initialStoreId }: CustomersClientProps) {
  // ALL HOOKS MUST BE CALLED FIRST
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Premium status check - Requirements: 1.1, 1.2
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();

  const [storeId, setStoreId] = useState<string | null>(initialStoreId);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasExistingCustomers, setHasExistingCustomers] = useState(false);

  // React Query hooks - only fetch if premium (to avoid server action errors)
  const {
    data: customers,
    isLoading: customersLoading,
    error: customersError,
    refetch,
  } = useCustomers(isPremium ? storeId || undefined : undefined);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setDebouncedQuery(query);
  }, 300);

  // Fetch store ID if not provided
  useEffect(() => {
    const fetchStoreId = async () => {
      if (!storeId && user) {
        try {
          const { getStoreAction } = await import("@/app/actions/store");
          const result = await getStoreAction();
          if (result.success && result.data) {
            setStoreId(result.data.id);
          }
        } catch (error) {
          console.error("Failed to fetch store:", error);
        }
      }
    };
    fetchStoreId();
  }, [storeId, user]);

  // Check if user has existing customers (for data preservation message)
  // Requirements: 5.3
  useEffect(() => {
    const checkExistingCustomers = async () => {
      if (!isPremium && storeId) {
        try {
          // Use direct Supabase query to check count without premium restriction
          const { hasExistingCustomersAction } = await import(
            "@/app/actions/customers"
          );
          const result = await hasExistingCustomersAction(storeId);
          if (result.success && result.data) {
            setHasExistingCustomers(result.data);
          }
        } catch {
          // Silently fail - default to false
        }
      }
    };
    checkExistingCustomers();
  }, [isPremium, storeId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dashboard/login");
    }
  }, [user, authLoading, router]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!debouncedQuery.trim()) return customers;

    const query = debouncedQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.address.toLowerCase().includes(query)
    );
  }, [customers, debouncedQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleAddNew = useCallback(() => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (customerId: string) => {
      if (!storeId) return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      );
      if (!confirmed) return;

      setDeletingId(customerId);
      try {
        await deleteMutation.mutateAsync({ id: customerId, storeId });
        toast.success("Customer deleted successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete customer"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [storeId, deleteMutation]
  );

  const handleFormSubmit = useCallback(
    async (data: CustomerInsert | CustomerUpdate) => {
      if (!storeId) return;

      try {
        if (editingCustomer) {
          await updateMutation.mutateAsync({
            id: editingCustomer.id,
            data: data as CustomerUpdate,
            storeId,
          });
          toast.success("Customer updated successfully");
        } else {
          await createMutation.mutateAsync(data as CustomerInsert);
          toast.success("Customer created successfully");
        }
        setIsFormOpen(false);
        setEditingCustomer(null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save customer"
        );
      }
    },
    [storeId, editingCustomer, createMutation, updateMutation]
  );

  const handleBack = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Conditional returns AFTER all hooks
  if (authLoading || premiumLoading) {
    return <CustomersSkeleton />;
  }

  if (!user) {
    return null;
  }

  // Show locked state for free users - Requirements: 1.1, 1.2, 5.3
  if (!isPremium) {
    return <CustomersLocked hasExistingCustomers={hasExistingCustomers} />;
  }

  // Show loading state for premium users while customers are loading
  if (customersLoading && !customers) {
    return <CustomersSkeleton />;
  }

  // Error state - show inline error with retry option
  if (customersError && !customers) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <div className="flex items-center h-16">
              <button
                onClick={handleBack}
                className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2 lg:hidden"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Customers
              </h1>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to load customers
            </h2>
            <p className="text-gray-600 mb-6">
              {customersError instanceof Error
                ? customersError.message
                : "We couldn't load your customer list. Please try again."}
            </p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw size={18} />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2 lg:hidden"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Customers
              </h1>
            </div>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search customers by name, phone, or address..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-4">
          <CustomerList
            customers={filteredCustomers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingId || undefined}
          />
        </div>
      </div>

      {/* Customer Form Dialog */}
      {storeId && (
        <CustomerForm
          customer={editingCustomer || undefined}
          storeId={storeId}
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingCustomer(null);
          }}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
