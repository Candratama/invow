"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { storesService, userPreferencesService } from "@/lib/db/services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { storeSettingsQueryKey } from "@/lib/hooks/use-store-settings";
import {
  INVOICE_TEMPLATES,
  type InvoiceTemplateId,
} from "@/components/features/invoice/templates";

const invoiceSettingsSchema = z.object({
  selectedTemplate: z.string(),
  paymentMethod: z.string().optional().or(z.literal("")),
  taxEnabled: z.boolean(),
  taxPercentage: z.number().min(0).max(100).optional(),
  exportQuality: z.union([z.literal(50), z.literal(100), z.literal(150)]),
});

type InvoiceSettingsFormData = z.infer<typeof invoiceSettingsSchema>;

interface InvoiceSettingsTabProps {
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

// Template display information
const TEMPLATE_INFO: Record<
  InvoiceTemplateId,
  { name: string; description: string }
> = {
  classic: { name: "Classic", description: "Traditional invoice layout" },
  simple: { name: "Simple", description: "Clean and minimal design" },
  modern: { name: "Modern", description: "Contemporary style" },
  elegant: { name: "Elegant", description: "Sophisticated look" },
  bold: { name: "Bold", description: "Strong visual impact" },
  compact: { name: "Compact", description: "Space-efficient layout" },
  creative: { name: "Creative", description: "Unique and artistic" },
  corporate: { name: "Corporate", description: "Professional business style" },
};

export function InvoiceSettingsTab({
  onClose,
  onDirtyChange,
}: InvoiceSettingsTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  const form = useForm<InvoiceSettingsFormData>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      selectedTemplate: "classic",
      paymentMethod: "",
      taxEnabled: false,
      taxPercentage: 0,
      exportQuality: 100,
    },
  });

  // Fetch store data with optimized settings
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: async () => {
      const { data, error } = await storesService.getDefaultStore();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch user preferences with optimized settings
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const { data, error } = await userPreferencesService.getUserPreferences();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (store && preferences) {
      setStoreId(store.id);
      // Use reset instead of setValue to properly set initial values
      // This prevents the form from being marked as dirty on load
      form.reset({
        selectedTemplate: preferences.selected_template || "classic",
        paymentMethod: store.payment_method || "",
        taxEnabled: preferences.tax_enabled,
        taxPercentage: preferences.tax_percentage || 0,
        exportQuality: preferences.export_quality_kb,
      });
    }
  }, [store, preferences, form]);

  // Track form dirty state
  useEffect(() => {
    if (onDirtyChange) {
      const isDirty = form.formState.isDirty;
      onDirtyChange(isDirty);
    }
  }, [form.formState.isDirty, onDirtyChange]);

  // Watch tax enabled to disable/enable percentage input
  const taxEnabled = form.watch("taxEnabled");

  // Submit handler
  const onSubmit = async (data: InvoiceSettingsFormData) => {
    setSaving(true);
    try {
      // Save payment method to store settings (only if store exists)
      if (storeId) {
        const { error: storeError } = await storesService.updateStore(storeId, {
          payment_method: data.paymentMethod || null,
        });

        if (storeError) {
          toast.error(`Failed to save payment method: ${storeError.message}`);
          return;
        }
      }

      // Save tax settings and export quality to user preferences
      const { error: taxError } =
        await userPreferencesService.updateTaxSettings(
          data.taxEnabled,
          data.taxPercentage
        );

      if (taxError) {
        toast.error(`Failed to save tax settings: ${taxError.message}`);
        return;
      }

      const { error: exportError } =
        await userPreferencesService.updateExportQuality(data.exportQuality);

      if (exportError) {
        toast.error(`Failed to save export quality: ${exportError.message}`);
        return;
      }

      // Save template selection
      const { error: templateError } =
        await userPreferencesService.updateSelectedTemplate(
          data.selectedTemplate as InvoiceTemplateId
        );

      if (templateError) {
        toast.error(
          `Failed to save template selection: ${templateError.message}`
        );
        return;
      }

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reset form with current values to clear dirty state
      form.reset(data);

      // Reset dirty state
      if (onDirtyChange) {
        onDirtyChange(false);
      }

      toast.success("Invoice settings saved successfully!");
    } catch (error) {
      console.error("Error saving invoice settings:", error);
      toast.error("Failed to save invoice settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingStore || isLoadingPreferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading invoice settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 space-y-4 sm:space-y-6 lg:py-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:max-w-3xl lg:mx-auto space-y-4 sm:space-y-6"
          id="invoice-settings-form"
        >
          {/* Template Section */}

          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2">
            Template
          </h2>
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
            <Label className="text-sm font-medium mb-3 block">
              Select Invoice Template
            </Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {(Object.keys(INVOICE_TEMPLATES) as InvoiceTemplateId[]).map(
                (templateId) => {
                  const info = TEMPLATE_INFO[templateId];
                  const isSelected =
                    form.watch("selectedTemplate") === templateId;

                  return (
                    <button
                      key={templateId}
                      type="button"
                      onClick={() =>
                        form.setValue("selectedTemplate", templateId)
                      }
                      className={`relative p-3 sm:p-4 border-2 rounded-lg transition-all hover:border-primary/50 min-h-[80px] ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-medium text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">
                          {info.name}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">
                          {info.description}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Defaults Section */}

          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2">
            Payment
          </h2>
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium">
                Default Payment Method
              </Label>
              <Input
                id="paymentMethod"
                {...form.register("paymentMethod")}
                placeholder="e.g., Bank Transfer, Cash, Credit Card"
                className="mt-2 min-h-[44px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be pre-filled when creating new invoices
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="taxEnabled" className="text-sm font-medium">
                    Enable Tax
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Apply tax to invoices by default
                  </p>
                </div>
                <Switch
                  id="taxEnabled"
                  checked={taxEnabled}
                  onCheckedChange={(checked) =>
                    form.setValue("taxEnabled", checked)
                  }
                  className="flex-shrink-0"
                />
              </div>

              {taxEnabled && (
                <div>
                  <Label
                    htmlFor="taxPercentage"
                    className="text-sm font-medium"
                  >
                    Tax Percentage (%)
                  </Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...form.register("taxPercentage", {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-2 min-h-[44px]"
                  />
                  {form.formState.errors.taxPercentage && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.taxPercentage.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}

          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2">
            Export
          </h2>
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
            <Label className="text-sm font-medium mb-2 sm:mb-3 block">
              Export Quality
            </Label>
            <p className="text-xs text-gray-500 mb-3 sm:mb-4">
              Choose the quality of exported invoice images
            </p>
            <RadioGroup
              value={form.watch("exportQuality").toString()}
              onValueChange={(value) =>
                form.setValue(
                  "exportQuality",
                  parseInt(value) as 50 | 100 | 150
                )
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 min-h-[44px]">
                <RadioGroupItem value="50" id="quality-50" />
                <Label
                  htmlFor="quality-50"
                  className="text-sm font-normal cursor-pointer"
                >
                  Small (50KB) - Faster sharing, lower quality
                </Label>
              </div>
              <div className="flex items-center space-x-3 min-h-[44px]">
                <RadioGroupItem value="100" id="quality-100" />
                <Label
                  htmlFor="quality-100"
                  className="text-sm font-normal cursor-pointer"
                >
                  Medium (100KB) - Balanced quality and size
                </Label>
              </div>
              <div className="flex items-center space-x-3 min-h-[44px]">
                <RadioGroupItem value="150" id="quality-150" />
                <Label
                  htmlFor="quality-150"
                  className="text-sm font-normal cursor-pointer"
                >
                  High (150KB) - Best quality, larger file
                </Label>
              </div>
            </RadioGroup>
          </div>
        </form>
      </div>

      {/* Fixed Action Buttons - Sticky at bottom */}
      <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4 lg:p-6 shadow-lg z-10">
        <div className="flex gap-2 sm:gap-3 lg:max-w-3xl lg:mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 min-h-[44px]"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="invoice-settings-form"
            className="flex-1 bg-primary text-white hover:bg-primary/90 min-h-[44px]"
            size="lg"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Invoice Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
