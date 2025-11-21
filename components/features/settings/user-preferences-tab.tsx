"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { userPreferencesService, storesService } from "@/lib/db/services";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { ExportQualitySettings } from "@/components/features/settings/export-quality-settings";
import { TaxSettings } from "@/components/features/settings/tax-settings";

const preferencesSchema = z.object({
  currency: z.string().length(3),
  default_store_id: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface UserPreferencesTabProps {
  onClose: () => void;
}

// Fixed defaults - not user-configurable
const DEFAULT_LANGUAGE = "en";
const DEFAULT_TIMEZONE = "Asia/Jakarta";
const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";

const currencies = [
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
];

export function UserPreferencesTab({ onClose }: UserPreferencesTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // State for export quality and tax settings
  const [exportQuality, setExportQuality] = useState<50 | 100 | 150>(100);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState<string>("0");

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currency: "IDR",
      default_store_id: undefined,
    },
  });

  // React Query: Fetch user preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const { data, error } = await userPreferencesService.getPreferences();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // React Query: Fetch stores
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await storesService.getStores();
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const loading = loadingPreferences || loadingStores;

  // Mutation: Save preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData & { preferred_language: string; timezone: string; date_format: string }) => {
      const { error } = await userPreferencesService.upsertPreferences({
        preferred_language: data.preferred_language,
        timezone: data.timezone,
        date_format: data.date_format,
        currency: data.currency,
        default_store_id: data.default_store_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  // Load preferences into form when data is available
  useEffect(() => {
    if (preferences) {
      form.reset({
        currency: preferences.currency,
        default_store_id: preferences.default_store_id || undefined,
      });
    }
  }, [preferences, form]);

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      // Validate tax percentage if enabled
      if (taxEnabled) {
        const percentageNum = parseFloat(taxPercentage);
        if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
          alert("Tax percentage must be between 0 and 100");
          return;
        }
      }

      // Save all preferences with fixed defaults for language, timezone, and date format
      await savePreferencesMutation.mutateAsync({
        ...data,
        preferred_language: DEFAULT_LANGUAGE,
        timezone: DEFAULT_TIMEZONE,
        date_format: DEFAULT_DATE_FORMAT,
      });
      
      // Save export quality
      const { error: exportError } = await userPreferencesService.updateExportQuality(exportQuality);
      if (exportError) {
        throw new Error("Failed to save export quality: " + exportError.message);
      }

      // Save tax settings
      const percentageNum = taxEnabled ? parseFloat(taxPercentage) : undefined;
      const { error: taxError } = await userPreferencesService.updateTaxSettings(taxEnabled, percentageNum);
      if (taxError) {
        throw new Error("Failed to save tax settings: " + taxError.message);
      }

      alert("Preferences saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert(error instanceof Error ? error.message : "Failed to save preferences. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 lg:py-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:max-w-3xl lg:mx-auto space-y-6"
          id="preferences-form"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">User Preferences</h3>
            <p className="text-sm text-gray-600">
              These settings apply to your entire account across all stores
            </p>
          </div>

          {/* Currency */}
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={form.watch("currency")}
              onValueChange={(value) => form.setValue("currency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Default currency for invoices and reports
            </p>
          </div>

          {/* Default Store (for multi-store users) */}
          {stores.length > 1 && (
            <div>
              <Label htmlFor="defaultStore">Default Store</Label>
              <Select
                value={form.watch("default_store_id") || ""}
                onValueChange={(value) =>
                  form.setValue("default_store_id", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                The store that opens by default when you start the app
              </p>
            </div>
          )}

         
        </form>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8" />

        {/* Export Quality Section */}
        <div className="lg:max-w-3xl lg:mx-auto">
          <ExportQualitySettings 
            value={exportQuality}
            onChange={setExportQuality}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8" />

        {/* Tax Settings Section */}
        <div className="lg:max-w-3xl lg:mx-auto">
          <TaxSettings 
            taxEnabled={taxEnabled}
            taxPercentage={taxPercentage}
            onTaxEnabledChange={setTaxEnabled}
            onTaxPercentageChange={setTaxPercentage}
          />
        </div>
      </div>

      {/* Fixed Action Buttons - Sticky at bottom */}
      <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white p-4 lg:p-6 shadow-lg">
        <div className="flex gap-3 lg:max-w-3xl lg:mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="preferences-form"
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            size="lg"
            disabled={savePreferencesMutation.isPending}
          >
            {savePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
