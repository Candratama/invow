"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Download, Loader2, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useInvoiceStore } from "@/lib/store";
import { InvoiceItem, Invoice } from "@/lib/types";
import { formatCurrency, parseLocalDate, formatDateForInput, generateInvoiceNumber, formatDate, generateUUID } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ItemRow } from "@/components/features/invoice/item-row";
import { generateJPEGFromInvoice } from "@/lib/utils/invoice-generator";
import { ClassicInvoiceTemplate } from "@/components/features/invoice/templates";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreateInvoice, useSubscriptionStatus } from "@/lib/hooks/use-dashboard-data";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";
import { useDefaultStore } from "@/lib/hooks/use-default-store";
import { calculateTotal } from "@/lib/utils/invoice-calculation";
import { userPreferencesService, invoicesService } from "@/lib/db/services";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string(),
  customerName: z
    .string()
    .min(3, "Customer name must be at least 3 characters"),
  customerAddress: z.string().optional(),
  customerStatus: z.enum(["Distributor", "Reseller", "Customer"]),
  shippingCost: z.number().min(0),
  note: z.string().optional(),
});

const itemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type ItemFormData = z.infer<typeof itemSchema>;

interface InvoiceFormProps {
  onComplete?: () => void;
}

export function InvoiceForm({ onComplete }: InvoiceFormProps) {
  const {
    currentInvoice,
    setCurrentInvoice,
    updateCurrentInvoice,
    addInvoiceItem,
    updateInvoiceItem,
    removeInvoiceItem,
    calculateTotals,
  } = useInvoiceStore();

  const { user } = useAuth();
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  // Tax preferences state
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  
  // Use React Query hooks for subscription status, store settings, and invoice creation
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const { data: storeSettings } = useStoreSettings();
  const { data: defaultStore } = useDefaultStore();
  const createInvoice = useCreateInvoice();

  // Initialize invoice when component mounts
  useEffect(() => {
    const initInvoice = async () => {
      // Wait for both user and defaultStore to be available
      if (!user?.id || !defaultStore?.id) {
        console.log('⏳ Waiting for user or store...', { userId: user?.id, storeId: defaultStore?.id });
        return;
      }

      // Check if we need to initialize or fix existing invoice
      const needsInit = !currentInvoice;
      const needsFix = currentInvoice?.invoiceNumber?.includes('XXXXXXXX');

      if (!needsInit && !needsFix) {
        console.log('✅ Invoice already properly initialized');
        return;
      }

      console.log('🚀 Initializing/fixing invoice with userId:', user.id);

      // Get sequence number for today
      const today = new Date();
      const dateStr = formatDateForInput(today);
      const { data: sequence } = await invoicesService.getNextInvoiceSequence(defaultStore.id, dateStr);
      
      // Generate invoice number with actual user ID
      const invoiceNumber = generateInvoiceNumber(today, user.id, sequence || 1);
      
      console.log('✅ Generated invoice number:', invoiceNumber);

      if (needsInit) {
        // Initialize new invoice with proper invoice number
        const newInvoice: Partial<Invoice> = {
          id: generateUUID(),
          invoiceNumber,
          invoiceDate: today,
          dueDate: today,
          customer: { name: "", email: "", status: "Customer" },
          items: [],
          subtotal: 0,
          shippingCost: 0,
          total: 0,
          status: "draft",
          createdAt: today,
          updatedAt: today,
        };

        setCurrentInvoice(newInvoice);
        console.log('✨ New invoice initialized');
      } else if (needsFix) {
        // Fix existing invoice number
        updateCurrentInvoice({ invoiceNumber });
        console.log('🔧 Invoice number fixed');
      }
    };
    
    initInvoice();
  }, [user?.id, defaultStore?.id, currentInvoice, setCurrentInvoice, updateCurrentInvoice]);

  // Fetch tax preferences on mount
  useEffect(() => {
    const fetchTaxPreferences = async () => {
      try {
        const { data } = await userPreferencesService.getUserPreferences();
        setTaxEnabled(data.tax_enabled);
        setTaxPercentage(data.tax_percentage ?? 0);
      } catch (error) {
        console.error("Failed to fetch tax preferences:", error);
      }
    };

    fetchTaxPreferences();
  }, []);

  // Main form
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: currentInvoice?.invoiceNumber || "",
      invoiceDate: currentInvoice?.invoiceDate
        ? formatDateForInput(new Date(currentInvoice.invoiceDate))
        : formatDateForInput(new Date()),
      customerName: currentInvoice?.customer?.name || "",
      customerAddress: currentInvoice?.customer?.address || "",
      customerStatus: currentInvoice?.customer?.status || "Customer",
      shippingCost: currentInvoice?.shippingCost || 0,
    },
  });

  // Update form when currentInvoice changes (e.g., when invoice number is generated or loaded from history)
  useEffect(() => {
    if (currentInvoice) {
      form.reset({
        invoiceNumber: currentInvoice.invoiceNumber || "",
        invoiceDate: currentInvoice.invoiceDate
          ? formatDateForInput(new Date(currentInvoice.invoiceDate))
          : formatDateForInput(new Date()),
        customerName: currentInvoice.customer?.name || "",
        customerAddress: currentInvoice.customer?.address || "",
        customerStatus: currentInvoice.customer?.status || "Customer",
        shippingCost: currentInvoice.shippingCost || 0,
        note: currentInvoice.note || "",
      });
    }
  }, [currentInvoice, form]);

  // Item form
  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      description: "",
      quantity: 1,
      price: undefined,
    },
  });


  const handleFormChange = (
    field: keyof InvoiceFormData,
    value: string | Date | number,
  ) => {
    if (
      field === "customerName" ||
      field === "customerAddress" ||
      field === "customerStatus"
    ) {
      updateCurrentInvoice({
        customer: {
          ...currentInvoice?.customer,
          name:
            field === "customerName"
              ? String(value)
              : currentInvoice?.customer?.name || "",
          email: "", // Email removed
          address:
            field === "customerAddress"
              ? String(value)
              : currentInvoice?.customer?.address,
          status:
            field === "customerStatus"
              ? (value as "Distributor" | "Reseller" | "Customer")
              : currentInvoice?.customer?.status,
        },
      });
    } else if (field === "invoiceDate") {
      // Parse date string as local date to avoid timezone issues
      const newDate = parseLocalDate(String(value));
      
      // Regenerate invoice number based on new date with sequence
      const regenerateInvoiceNumber = async () => {
        if (user?.id && defaultStore?.id) {
          const dateStr = String(value);
          const { data: sequence } = await invoicesService.getNextInvoiceSequence(defaultStore.id, dateStr);
          const newInvoiceNumber = generateInvoiceNumber(newDate, user.id, sequence || 1);
          console.log('📅 Date changed, new invoice number:', newInvoiceNumber);
          updateCurrentInvoice({
            [field]: newDate,
            invoiceNumber: newInvoiceNumber,
          });
        } else {
          console.warn('⚠️ Cannot regenerate invoice number: user or store not available');
          updateCurrentInvoice({
            [field]: newDate,
          });
        }
      };
      
      regenerateInvoiceNumber();
    } else {
      updateCurrentInvoice({
        [field]: value,
      });
    }
  };

  const handleAddItem = (data: ItemFormData) => {
    if (editingItem) {
      updateInvoiceItem(editingItem.id, data);
    } else {
      addInvoiceItem(data);
    }
    calculateTotals();
    itemForm.reset();
    setEditingItem(null);
    setShowItemModal(false);
  };

  const handleEditItem = (item: InvoiceItem) => {
    setEditingItem(item);
    itemForm.reset({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    });
    setShowItemModal(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Delete this item?")) {
      removeInvoiceItem(id);
      calculateTotals();
    }
  };

  const handleQuickDownload = async () => {
    if (
      !currentInvoice ||
      !currentInvoice.items ||
      currentInvoice.items.length === 0
    ) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    setIsDownloading(true);
    try {
      // Small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Save invoice using React Query mutation
      if (currentInvoice.id && user?.id) {
        try {
          // Check if default store is available (already cached by React Query)
          if (!defaultStore) {
            toast.error("No store found. Please set up your store first.");
            setIsDownloading(false);
            return;
          }

          // Prepare invoice data for mutation
          // Format date as YYYY-MM-DD for database (no time component)
          const invoiceDate = currentInvoice.invoiceDate 
            ? formatDateForInput(new Date(currentInvoice.invoiceDate))
            : formatDateForInput(new Date());
          
          // Calculate tax and total
          const calculation = calculateTotal(
            currentInvoice.subtotal || 0,
            currentInvoice.shippingCost || 0,
            taxEnabled,
            taxPercentage
          );
          
          const invoiceData = {
            invoice: {
              id: currentInvoice.id,
              store_id: defaultStore.id,
              invoice_number: currentInvoice.invoiceNumber || '',
              invoice_date: invoiceDate,
              customer_name: currentInvoice.customer?.name || '',
              customer_email: currentInvoice.customer?.email || '',
              customer_address: currentInvoice.customer?.address || '',
              customer_status: currentInvoice.customer?.status || 'Customer',
              subtotal: calculation.subtotal,
              shipping_cost: calculation.shippingCost,
              tax_amount: calculation.taxAmount,
              total: calculation.total,
              note: currentInvoice.note || '',
              status: 'synced' as const,
            },
            items: (currentInvoice.items || []).map((item, index) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              position: index,
            })),
          };

          // Use mutation to save invoice with optimistic updates
          await createInvoice.mutateAsync(invoiceData);
          
          // Success feedback is shown via optimistic update (< 500ms)
        } catch (error) {
          console.error("Failed to save invoice:", error);
          
          // Display appropriate error messages
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes('limit reached')) {
            toast.error("You have reached your monthly invoice limit. Please upgrade your plan to generate more invoices.");
          } else {
            toast.error(errorMessage || "Failed to save invoice. Please try again.");
          }
          
          setIsDownloading(false);
          return;
        }
      }

      await generateJPEGFromInvoice(currentInvoice as Invoice, storeSettings ?? null);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!currentInvoice) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Form Content */}
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 space-y-6 lg:px-8">
        {/* Invoice Number Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">
                Invoice Number
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Auto-generated)
                </span>
              </Label>
              <Input
                id="invoiceNumber"
                {...form.register("invoiceNumber")}
                readOnly
                disabled
                className="text-lg font-semibold bg-gray-50 cursor-not-allowed"
                title="Invoice number is automatically generated based on date and your user ID"
              />
              {form.formState.errors.invoiceNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.invoiceNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                {...form.register("invoiceDate")}
                onChange={(e) =>
                  handleFormChange("invoiceDate", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm lg:p-6">
          <h3 className="font-semibold text-lg mb-4 lg:text-xl">
            Customer Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...form.register("customerName")}
                onChange={(e) =>
                  handleFormChange("customerName", e.target.value)
                }
                placeholder="Enter customer name"
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>

            {/* 2-column layout for desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Customer Status */}
              <div>
                <Label htmlFor="customerStatus">Customer Status</Label>
                <select
                  id="customerStatus"
                  {...form.register("customerStatus")}
                  onChange={(e) =>
                    handleFormChange("customerStatus", e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 pr-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Customer">Customer</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>

              {/* Spacer for alignment */}
              <div className="hidden lg:block"></div>
            </div>

            {/* Customer Address */}
            <div>
              <Label htmlFor="customerAddress">Address (Optional)</Label>
              <Textarea
                id="customerAddress"
                {...form.register("customerAddress")}
                onChange={(e) =>
                  handleFormChange("customerAddress", e.target.value)
                }
                placeholder="Enter customer address"
                rows={3}
                className="lg:rows-4"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg lg:text-xl">Items</h3>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                itemForm.reset();
                setShowItemModal(true);
              }}
              className="gap-2"
            >
              <Plus size={18} />
              Add Item
            </Button>
          </div>

          {currentInvoice.items && currentInvoice.items.length > 0 ? (
            <div className="space-y-3">
              {currentInvoice.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No items added yet. Tap &quot;Add Item&quot; to get started.
            </p>
          )}
        </div>

        {/* Note Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm lg:p-6">
          <Label htmlFor="note" className="lg:text-base">
            Note (Optional)
          </Label>
          <Textarea
            id="note"
            value={currentInvoice.note || ""}
            onChange={(e) => handleFormChange("note", e.target.value)}
            placeholder="Add any additional notes or instructions..."
            rows={3}
            className="mt-2 lg:rows-4"
          />
        </div>

        {/* Totals Section */}
        {currentInvoice.items && currentInvoice.items.length > 0 && (() => {
          const calculation = calculateTotal(
            currentInvoice.subtotal || 0,
            currentInvoice.shippingCost || 0,
            taxEnabled,
            taxPercentage
          );
          
          return (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(calculation.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600">Shipping</span>
                  <CurrencyInput
                    value={currentInvoice.shippingCost || 0}
                    onChange={(value) => {
                      handleFormChange("shippingCost", value);
                      calculateTotals();
                    }}
                    className="w-32 h-8 text-sm text-right"
                    placeholder="0"
                  />
                </div>

                {taxEnabled && taxPercentage > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">Tax ({taxPercentage}%)</span>
                    <span className="font-medium">
                      {formatCurrency(calculation.taxAmount)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(calculation.total)}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Fixed Bottom Actions - Green Zone */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 lg:fixed lg:border-t lg:p-4">
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-3">
          {/* Warning message when near limit */}
          {!isLoadingSubscription && subscriptionStatus && subscriptionStatus.remainingInvoices <= 5 && subscriptionStatus.remainingInvoices > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  {subscriptionStatus.remainingInvoices} invoice{subscriptionStatus.remainingInvoices !== 1 ? 's' : ''} remaining
                </p>
                <p className="text-yellow-700 mt-0.5">
                  You&apos;re running low on invoices. Consider upgrading your plan.
                </p>
              </div>
            </div>
          )}

          {/* Error message when limit reached */}
          {!isLoadingSubscription && subscriptionStatus && subscriptionStatus.remainingInvoices === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm flex-1">
                  <p className="font-medium text-red-800">
                    Monthly limit reached
                  </p>
                  <p className="text-red-700 mt-0.5">
                    You&apos;ve used all {subscriptionStatus.invoiceLimit} invoices for this month. Upgrade to generate more.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => window.location.href = '/dashboard/account'}
                variant="outline"
                size="sm"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                Upgrade Plan
              </Button>
            </div>
          )}

          {/* Show mutation error if any */}
          {createInvoice.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">
                  Failed to save invoice
                </p>
                <p className="text-red-700 mt-0.5">
                  {createInvoice.error instanceof Error ? createInvoice.error.message : 'An error occurred while saving the invoice'}
                </p>
              </div>
            </div>
          )}

          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={
                  !currentInvoice.items ||
                  currentInvoice.items.length === 0 ||
                  isDownloading ||
                  (!isLoadingSubscription && subscriptionStatus?.remainingInvoices === 0)
                }
                className="gap-2 w-full"
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Eye size={20} />
                    Review & Download
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Invoice Details</DialogTitle>
                <DialogDescription>
                  Please review the invoice details before downloading
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {/* Invoice Info */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Invoice Number</p>
                    <p className="text-sm font-semibold">{currentInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-semibold">
                      {formatDate(new Date(currentInvoice.invoiceDate || new Date()))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-semibold">{currentInvoice.customer?.name || 'No customer'}</p>
                    {currentInvoice.customer?.address && (
                      <p className="text-xs text-gray-600">{currentInvoice.customer.address}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">
                    Items ({currentInvoice.items?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {currentInvoice.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium truncate">{item.description}</p>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold whitespace-nowrap">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(currentInvoice.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {formatCurrency(currentInvoice.shippingCost || 0)}
                    </span>
                  </div>
                  {taxEnabled && taxPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({taxPercentage}%)</span>
                      <span className="font-medium">
                        {formatCurrency(calculateTotal(
                          currentInvoice.subtotal || 0,
                          currentInvoice.shippingCost || 0,
                          taxEnabled,
                          taxPercentage
                        ).taxAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-1.5 border-t border-gray-300">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(calculateTotal(
                        currentInvoice.subtotal || 0,
                        currentInvoice.shippingCost || 0,
                        taxEnabled,
                        taxPercentage
                      ).total)}
                    </span>
                  </div>
                </div>

                {/* Note if exists */}
                {currentInvoice.note && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Note</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {currentInvoice.note}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsReviewDialogOpen(false);
                    handleQuickDownload();
                  }}
                  disabled={isDownloading}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download JPEG
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Item Modal */}
      <BottomSheet
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
          itemForm.reset();
        }}
        title={editingItem ? "Edit Item" : "Add Item"}
        maxWidth="lg"
      >
        <form
          onSubmit={itemForm.handleSubmit(handleAddItem)}
          className="py-4 space-y-4 lg:py-6"
        >
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              {...itemForm.register("description")}
              placeholder="Item description"
              autoFocus
            />
            {itemForm.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {itemForm.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                {...itemForm.register("quantity", { valueAsNumber: true })}
                min="1"
              />
              {itemForm.formState.errors.quantity && (
                <p className="text-sm text-red-500 mt-1">
                  {itemForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Price *</Label>
              <Controller
                name="price"
                control={itemForm.control}
                render={({ field }) => (
                  <CurrencyInput
                    id="price"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
              {itemForm.formState.errors.price && (
                <p className="text-sm text-red-500 mt-1">
                  {itemForm.formState.errors.price.message}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowItemModal(false);
                setEditingItem(null);
                itemForm.reset();
              }}
              className="flex-1"
              size="lg"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" size="lg">
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Hidden Invoice Preview for Quick Download */}
      {currentInvoice &&
        currentInvoice.items &&
        currentInvoice.items.length > 0 && (
          <ClassicInvoiceTemplate
            invoice={currentInvoice as Invoice}
            storeSettings={storeSettings ?? null}
          />
        )}
    </div>
  );
}
