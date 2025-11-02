"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Download, Loader2 } from "lucide-react";
import { useInvoiceStore } from "@/lib/store";
import { InvoiceItem, Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ItemRow } from "./item-row";
import { BottomSheet } from "./bottom-sheet";
import { generateJPEGFromInvoice } from "@/lib/invoice-generator";
import { HiddenInvoiceRender } from "./hidden-invoice-render";

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

interface InvoiceFormMobileProps {
  onComplete?: () => void;
}

export function InvoiceFormMobile({ onComplete }: InvoiceFormMobileProps) {
  const {
    currentInvoice,
    updateCurrentInvoice,
    addInvoiceItem,
    updateInvoiceItem,
    removeInvoiceItem,
    calculateTotals,
    initializeNewInvoice,
  } = useInvoiceStore();

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize invoice if not exists
  useEffect(() => {
    if (!currentInvoice) {
      initializeNewInvoice();
    }
  }, [currentInvoice, initializeNewInvoice]);

  // Main form
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: currentInvoice?.invoiceNumber || "",
      invoiceDate: currentInvoice?.invoiceDate
        ? new Date(currentInvoice.invoiceDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      customerName: currentInvoice?.customer?.name || "",
      customerAddress: currentInvoice?.customer?.address || "",
      customerStatus: currentInvoice?.customer?.status || "Customer",
      shippingCost: currentInvoice?.shippingCost || 0,
    },
  });

  // Update form when currentInvoice changes (e.g., when invoice number is generated)
  useEffect(() => {
    if (currentInvoice) {
      form.reset({
        invoiceNumber: currentInvoice.invoiceNumber || "",
        invoiceDate: currentInvoice.invoiceDate
          ? new Date(currentInvoice.invoiceDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        customerName: currentInvoice.customer?.name || "",
        customerAddress: currentInvoice.customer?.address || "",
        customerStatus: currentInvoice.customer?.status || "Customer",
        shippingCost: currentInvoice.shippingCost || 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInvoice?.invoiceNumber]);

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
      updateCurrentInvoice({
        [field]: new Date(value),
      });
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
      alert("Please add at least one item to the invoice");
      return;
    }

    setIsDownloading(true);
    try {
      // Small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { storeSettings, saveCompleted } =
        useInvoiceStore.getState();
      await generateJPEGFromInvoice(currentInvoice as Invoice, storeSettings);

      // Save as completed
      if (currentInvoice.id) {
        saveCompleted();
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download invoice. Please try Preview instead.");
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
        {currentInvoice.items && currentInvoice.items.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(currentInvoice.subtotal || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-base">
                <span className="text-gray-600">Ongkos Kirim</span>
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

              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(currentInvoice.total || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions - Green Zone */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 lg:fixed lg:border-t lg:p-4">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <Button
            type="button"
            onClick={handleQuickDownload}
            disabled={
              !currentInvoice.items ||
              currentInvoice.items.length === 0 ||
              isDownloading
            }
            className="gap-2 w-full"
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={20} />
                Download JPEG
              </>
            )}
          </Button>
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
          <HiddenInvoiceRender
            invoice={currentInvoice as Invoice}
            storeSettings={useInvoiceStore.getState().storeSettings}
          />
        )}
    </div>
  );
}
