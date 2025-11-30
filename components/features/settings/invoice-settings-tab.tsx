"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Check, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updatePreferencesAction } from "@/app/actions/preferences";
import { updateStoreAction } from "@/app/actions/store";
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
  initialStore?: {
    id: string;
    payment_method?: string | null;
  } | null;
  initialPreferences?: {
    selected_template?: string | null;
    tax_enabled: boolean;
    tax_percentage?: number | null;
    export_quality_kb: number;
  } | null;
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
  initialStore,
  initialPreferences,
}: InvoiceSettingsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [previewTemplate, setPreviewTemplate] =
    useState<InvoiceTemplateId | null>(null);

  const form = useForm<InvoiceSettingsFormData>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      selectedTemplate: initialPreferences?.selected_template || "classic",
      paymentMethod: initialStore?.payment_method || "",
      taxEnabled: initialPreferences?.tax_enabled || false,
      taxPercentage: initialPreferences?.tax_percentage || 0,
      exportQuality: (initialPreferences?.export_quality_kb || 100) as
        | 50
        | 100
        | 150,
    },
  });

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
    startTransition(async () => {
      try {
        // Execute all saves in parallel for better performance
        const savePromises = [];

        // Save payment method to store settings (only if store exists)
        if (initialStore?.id) {
          savePromises.push(
            updateStoreAction({
              paymentMethod: data.paymentMethod || undefined,
            })
          );
        }

        // Save preferences (tax settings, export quality, and template selection)
        savePromises.push(
          updatePreferencesAction({
            tax_enabled: data.taxEnabled,
            tax_percentage: data.taxPercentage,
            export_quality_kb: data.exportQuality,
            selected_template: data.selectedTemplate as InvoiceTemplateId,
          })
        );

        // Wait for all saves to complete
        const results = await Promise.all(savePromises);

        // Check for errors
        const errors = results.filter((result) => !result.success);
        if (errors.length > 0) {
          const errorMessages = errors
            .map((err) => err.error)
            .filter(Boolean)
            .join(", ");
          toast.error(`Failed to save: ${errorMessages}`);
          return;
        }

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
      }
    });
  };

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
                            width={400}
                            height={533}
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
            Back
          </Button>
          <Button
            type="submit"
            form="invoice-settings-form"
            className="flex-1 bg-primary text-white hover:bg-primary/90 min-h-[44px]"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Invoice Settings"}
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
              width={800}
              height={1067}
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
