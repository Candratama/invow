"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { userPreferencesService, storesService } from "@/lib/db/services";
import type { Store } from "@/lib/db/database.types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const preferencesSchema = z.object({
  preferred_language: z.enum(["en", "id", "es", "fr", "de", "zh", "ja", "ko"]),
  timezone: z.string().min(3),
  date_format: z.string(),
  currency: z.string().length(3),
  default_store_id: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface UserPreferencesTabProps {
  onClose: () => void;
}

const languages = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB - GMT+7)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA - GMT+8)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT - GMT+9)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT - GMT+8)" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala Lumpur (GMT+8)" },
  { value: "Asia/Manila", label: "Asia/Manila (PST - GMT+8)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT - GMT+7)" },
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (ICT - GMT+7)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST - GMT+9)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (KST - GMT+9)" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong Kong (HKT - GMT+8)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST - GMT+8)" },
  { value: "Asia/Taipei", label: "Asia/Taipei (CST - GMT+8)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST - GMT+10)" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne (AEST - GMT+10)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST - GMT+12)" },
  { value: "America/New_York", label: "America/New York (EST - GMT-5)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST - GMT-8)" },
  { value: "America/Chicago", label: "America/Chicago (CST - GMT-6)" },
  { value: "America/Denver", label: "America/Denver (MST - GMT-7)" },
  { value: "America/Toronto", label: "America/Toronto (EST - GMT-5)" },
  { value: "America/Vancouver", label: "America/Vancouver (PST - GMT-8)" },
  { value: "America/Mexico_City", label: "America/Mexico City (CST - GMT-6)" },
  { value: "America/Sao_Paulo", label: "America/Sao Paulo (BRT - GMT-3)" },
  { value: "America/Buenos_Aires", label: "America/Buenos Aires (ART - GMT-3)" },
  { value: "Europe/London", label: "Europe/London (GMT - GMT+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET - GMT+1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET - GMT+1)" },
  { value: "Europe/Rome", label: "Europe/Rome (CET - GMT+1)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET - GMT+1)" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET - GMT+1)" },
  { value: "Europe/Budapest", label: "Europe/Budapest (CET - GMT+1)" },
  { value: "Europe/Warsaw", label: "Europe/Warsaw (CET - GMT+1)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (MSK - GMT+3)" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul (TRT - GMT+3)" },
  { value: "Europe/Dublin", label: "Europe/Dublin (GMT - GMT+0)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET - GMT+2)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT - GMT+1)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST - GMT+2)" },
  { value: "Indian/Dubai", label: "Dubai (GST - GMT+4)" },
  { value: "Indian/Mumbai", label: "India/Mumbai (IST - GMT+5:30)" },
];

const dateFormats = [
  { value: "YYYY-MM-DD", label: "2025-10-31 (ISO)" },
  { value: "DD/MM/YYYY", label: "31/10/2025 (European)" },
  { value: "MM/DD/YYYY", label: "10/31/2025 (US)" },
  { value: "DD-MM-YYYY", label: "31-10-2025" },
];

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [detectingTimezone, setDetectingTimezone] = useState(false);

  // Function to detect user's timezone
  const detectUserTimezone = () => {
    setDetectingTimezone(true);
    try {
      // Get timezone from browser
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check if detected timezone is in our options
      const timezoneExists = timezones.some(tz => tz.value === detectedTimezone);

      if (timezoneExists) {
        form.setValue("timezone", detectedTimezone);
        const selectedTimezone = timezones.find(tz => tz.value === detectedTimezone);
        alert(`Timezone automatically detected: ${selectedTimezone?.label}`);
      } else {
        // Find the closest fallback based on UTC offset
        const offset = new Date().getTimezoneOffset();
        const isNegative = offset <= 0;
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;

        let fallbackTimezone = "UTC";
        let fallbackReason = "";

        // Improved fallback logic with more timezone coverage
        if (!isNegative && hours === 7 && minutes === 0) {
          fallbackTimezone = "Asia/Jakarta";
          fallbackReason = "(GMT+7 detected)";
        } else if (!isNegative && hours === 8 && minutes === 0) {
          fallbackTimezone = "Asia/Singapore";
          fallbackReason = "(GMT+8 detected)";
        } else if (!isNegative && hours === 5 && minutes === 30) {
          fallbackTimezone = "Indian/Mumbai";
          fallbackReason = "(GMT+5:30 detected)";
        } else if (!isNegative && hours === 9 && minutes === 0) {
          fallbackTimezone = "Asia/Tokyo";
          fallbackReason = "(GMT+9 detected)";
        } else if (isNegative && hours === 5 && minutes === 0) {
          fallbackTimezone = "America/New_York";
          fallbackReason = "(GMT-5 detected)";
        } else if (isNegative && hours === 8 && minutes === 0) {
          fallbackTimezone = "America/Los_Angeles";
          fallbackReason = "(GMT-8 detected)";
        } else if (isNegative && hours === 6 && minutes === 0) {
          fallbackTimezone = "America/Chicago";
          fallbackReason = "(GMT-6 detected)";
        } else if (isNegative && hours === 0 && minutes === 0) {
          fallbackTimezone = "Europe/London";
          fallbackReason = "(GMT+0 detected)";
        } else if (!isNegative && hours === 1 && minutes === 0) {
          fallbackTimezone = "Europe/Paris";
          fallbackReason = "(GMT+1 detected)";
        } else {
          fallbackTimezone = "UTC";
          fallbackReason = `(UTC offset: ${isNegative ? '+' : '-'}${hours}:${minutes.toString().padStart(2, '0')})`;
        }

        form.setValue("timezone", fallbackTimezone);
        const selectedTimezone = timezones.find(tz => tz.value === fallbackTimezone);
        alert(`Timezone automatically detected: ${selectedTimezone?.label} ${fallbackReason}`);
      }
    } catch (error) {
      console.error("Error detecting timezone:", error);
      alert("Could not detect timezone. Please select manually.");
    } finally {
      setDetectingTimezone(false);
    }
  };

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferred_language: "en",
      timezone: "UTC",
      date_format: "YYYY-MM-DD",
      currency: "IDR",
      default_store_id: undefined,
    },
  });

  // Load preferences and stores
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load preferences
        const { data: prefs } = await userPreferencesService.getPreferences();

        if (prefs) {
          form.reset({
            preferred_language: prefs.preferred_language as "en" | "id" | "es" | "fr" | "de" | "zh" | "ja" | "ko",
            timezone: prefs.timezone,
            date_format: prefs.date_format,
            currency: prefs.currency,
            default_store_id: prefs.default_store_id || undefined,
          });
        } else {
          // Auto-detect timezone for new users
          try {
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const timezoneExists = timezones.some(tz => tz.value === detectedTimezone);

            if (timezoneExists) {
              form.setValue("timezone", detectedTimezone);
            } else {
              // Find fallback based on UTC offset (same logic as detectUserTimezone but silent)
              const offset = new Date().getTimezoneOffset();
              const isNegative = offset <= 0;
              const hours = Math.floor(Math.abs(offset) / 60);
              const minutes = Math.abs(offset) % 60;

              let fallbackTimezone = "UTC";

              if (!isNegative && hours === 7 && minutes === 0) {
                fallbackTimezone = "Asia/Jakarta";
              } else if (!isNegative && hours === 8 && minutes === 0) {
                fallbackTimezone = "Asia/Singapore";
              } else if (!isNegative && hours === 5 && minutes === 30) {
                fallbackTimezone = "Indian/Mumbai";
              } else if (!isNegative && hours === 9 && minutes === 0) {
                fallbackTimezone = "Asia/Tokyo";
              } else if (isNegative && hours === 5 && minutes === 0) {
                fallbackTimezone = "America/New_York";
              } else if (isNegative && hours === 8 && minutes === 0) {
                fallbackTimezone = "America/Los_Angeles";
              } else if (isNegative && hours === 6 && minutes === 0) {
                fallbackTimezone = "America/Chicago";
              } else if (isNegative && hours === 0 && minutes === 0) {
                fallbackTimezone = "Europe/London";
              } else if (!isNegative && hours === 1 && minutes === 0) {
                fallbackTimezone = "Europe/Paris";
              }

              form.setValue("timezone", fallbackTimezone);
            }
          } catch (error) {
            console.error("Error auto-detecting timezone:", error);
          }
        }

        // Load stores for default store selector
        const { data: storesData } = await storesService.getStores();
        setStores(storesData || []);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [form]);

  const onSubmit = async (data: PreferencesFormData) => {
    setSaving(true);
    try {
      const { error } = await userPreferencesService.upsertPreferences({
        preferred_language: data.preferred_language,
        timezone: data.timezone,
        date_format: data.date_format,
        currency: data.currency,
        default_store_id: data.default_store_id || null,
      });

      if (error) {
        alert(`Failed to save preferences: ${error.message}`);
        return;
      }

      alert("Preferences saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
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

          {/* Language */}
          <div>
            <Label htmlFor="language">Language</Label>
            <Select
              value={form.watch("preferred_language")}
              onValueChange={(value) =>
                form.setValue("preferred_language", value as "en" | "id" | "es" | "fr" | "de" | "zh" | "ja" | "ko")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              User interface language preference
            </p>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <div className="flex gap-2">
              <Select
                value={form.watch("timezone")}
                onValueChange={(value) => form.setValue("timezone", value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectUserTimezone}
                disabled={detectingTimezone}
                className="whitespace-nowrap"
              >
                {detectingTimezone ? "Detecting..." : "Auto-Detect"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used for displaying dates and times • Auto-detect works best from your current location
            </p>
          </div>

          {/* Date Format */}
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={form.watch("date_format")}
              onValueChange={(value) => form.setValue("date_format", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              How dates are displayed throughout the app
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

          {stores.length === 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Single Store Mode:</strong> You currently have one
                store. Create additional stores to enable multi-store features.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Fixed Action Buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 lg:p-6">
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
            className="flex-1"
            size="lg"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
