"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Check, Eye, X } from "lucide-react";
import { storesService, userPreferencesService } from "@/lib/db/services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { storeSettingsQueryKey } from "@/lib/hooks/use-store-settings";
import { userPreferencesQueryKey } from "@/lib/hooks/use-user-preferences";
import {
  INVOICE_TEMPLATES,
  type InvoiceTemplateId,
} from "@/components/features/invoice/templates";
import Image from "next/image";

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
  const [previewTemplate, setPreviewTemplate] =
    useState<InvoiceTemplateId | null>(null);

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

  // Fetch store data
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: async () => {
      const { data, error } = await storesService.getDefaultStore();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
    refetchOnWindowFocus: false,
  });

  // Fetch user preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: userPreferencesQueryKey,
    queryFn: async () => {
      const { data, error } = await userPreferencesService.getUserPreferences();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true, // Always fetch on mount to ensure fresh data
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
      // Execute all saves in parallel for better performance
      const savePromises = [];

      // Save payment method to store settings (only if store exists)
      if (storeId) {
        savePromises.push(
          storesService.updateStore(storeId, {
            payment_method: data.paymentMethod || null,
          })
        );
      }

      // Save tax settings, export quality, and template selection in parallel
      savePromises.push(
        userPreferencesService.updateTaxSettings(
          data.taxEnabled,
          data.taxPercentage
        ),
        userPreferencesService.updateExportQuality(data.exportQuality),
        userPreferencesService.updateSelectedTemplate(
          data.selectedTemplate as InvoiceTemplateId
        )
      );

      // Wait for all saves to complete
      const results = await Promise.all(savePromises);

      // Check for errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        const errorMessages = errors
          .map((err) => err.error?.message)
          .filter(Boolean)
          .join(", ");
        toast.error(`Failed to save: ${errorMessages}`);
        return;
      }

      // Invalidate caches in parallel
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey }),
        queryClient.invalidateQueries({ queryKey: userPreferencesQueryKey }),
      ]);

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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {(Object.keys(INVOICE_TEMPLATES) as InvoiceTemplateId[]).map(
                (templateId) => {
                  const info = TEMPLATE_INFO[templateId];
                  const isSelected =
                    form.watch("selectedTemplate") === templateId;

                  return (
                    <div key={templateId} className="relative group">
                      <div
                        onClick={() =>
                          form.setValue("selectedTemplate", templateId)
                        }
                        className={`w-full overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-primary/50"
                        }`}
                      >
                        {/* Preview Image */}
                        <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
                          <Image
                            src={`/template/${templateId}.jpg`}
                            alt={`${info.name} template preview`}
                            className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                          />

                          {/* Preview Button Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(templateId);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg hover:bg-gray-100 pointer-events-auto"
                            >
                              <Eye size={16} />
                              Preview
                            </button>
                          </div>
                        </div>

                        {/* Template Info */}
                        <div className="p-3 bg-white">
                          <div className="font-semibold text-sm mb-1">
                            {info.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {info.description}
                          </div>
                        </div>

                        {/* Selected Badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
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

      {/* Fullscreen Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <button
            onClick={() => setPreviewTemplate(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close preview"
          >
            <X size={24} />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <Image
              src={`/template/${previewTemplate}.jpg`}
              alt={`${TEMPLATE_INFO[previewTemplate].name} template preview`}
              className="w-full h-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center mt-4 text-white">
              <h3 className="text-xl font-semibold mb-1">
                {TEMPLATE_INFO[previewTemplate].name}
              </h3>
              <p className="text-sm text-gray-300">
                {TEMPLATE_INFO[previewTemplate].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
