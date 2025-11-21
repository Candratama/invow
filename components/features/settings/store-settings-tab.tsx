"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Camera, Upload, X } from "lucide-react";
import { storesService } from "@/lib/db/services";
import { compressImage, validateImageFile } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { storeSettingsQueryKey } from "@/lib/hooks/use-store-settings";
import { useQuery } from "@tanstack/react-query";

const optionalText = z.string().optional().or(z.literal(""));

const storeSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  whatsapp: z.string().min(10, "WhatsApp number must be at least 10 digits"),
  phone: optionalText,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: optionalText,
  storeDescription: optionalText,
  tagline: optionalText,
  storeNumber: optionalText,
  paymentMethod: optionalText,
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #10b981)"),
  invoicePrefix: z
    .string()
    .max(10, "Invoice prefix max 10 characters")
    .optional()
    .or(z.literal("")),
  storeCode: z
    .string()
    .regex(/^[A-Z0-9]{2,6}$/, "Store code must be 2-6 uppercase letters/numbers"),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreSettingsTabProps {
  onClose: () => void;
}

export function StoreSettingsTab({ onClose }: StoreSettingsTabProps) {
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      address: "",
      whatsapp: "",
      phone: "",
      email: "",
      website: "",
      storeDescription: "",
      tagline: "",
      storeNumber: "",
      paymentMethod: "",
      brandColor: "#10b981",
      invoicePrefix: "INV",
      storeCode: "",
    },
  });

  // Use React Query to fetch store data
  const { data: store, isLoading } = useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: async () => {
      const { data, error } = await storesService.getDefaultStore();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update form when store data is loaded
  useEffect(() => {
    if (store) {
      setStoreId(store.id);
      setLogo(store.logo || "");

      form.reset({
        name: store.name,
        address: store.address,
        whatsapp: store.whatsapp.replace(/^\+62/, ""),
        phone: store.phone || "",
        email: store.email || "",
        website: store.website || "",
        storeDescription: store.store_description || "",
        tagline: store.tagline || "",
        storeNumber: store.store_number || "",
        paymentMethod: store.payment_method || "",
        brandColor: store.brand_color,
        invoicePrefix: store.invoice_prefix || "INV",
        storeCode: store.store_code,
      });
    }
  }, [store, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Comprehensive image validation
      const validation = await validateImageFile(file, {
        maxSizeKB: 5000, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      if (!validation.valid) {
        toast.error(`Invalid image: ${validation.error}`);
        return;
      }

      const compressed = await compressImage(file, 100);
      setLogo(compressed);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image. Please try a different image.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogo("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: StoreFormData) => {
    if (!storeId) {
      toast.error("Store not found. Please refresh and try again.");
      return;
    }

    // Format WhatsApp
    let whatsapp = data.whatsapp.replace(/\D/g, "");
    if (whatsapp.startsWith("0")) {
      whatsapp = "62" + whatsapp.substring(1);
    } else if (!whatsapp.startsWith("62")) {
      whatsapp = "62" + whatsapp;
    }

    const sanitize = (val?: string) => {
      const trimmed = val?.trim();
      return trimmed || null;
    };

    setSaving(true);
    try {
      const { error } = await storesService.updateStore(storeId, {
        name: data.name,
        logo: logo || null,
        address: data.address,
        whatsapp: "+" + whatsapp,
        phone: sanitize(data.phone),
        email: sanitize(data.email),
        website: sanitize(data.website),
        store_description: sanitize(data.storeDescription),
        tagline: sanitize(data.tagline),
        store_number: sanitize(data.storeNumber),
        payment_method: sanitize(data.paymentMethod),
        brand_color: data.brandColor,
        invoice_prefix: sanitize(data.invoicePrefix),
        store_code: data.storeCode,
      });

      if (error) {
        toast.error(`Failed to save store: ${error.message}`);
        return;
      }

      // Invalidate React Query cache to refetch store settings
      await queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
      
      // Wait a bit to ensure refetch completes before closing dialog
      await new Promise(resolve => setTimeout(resolve, 200));

      toast.success("Store settings saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving store:", error);
      toast.error("Failed to save store settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading store settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 lg:py-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:max-w-3xl lg:mx-auto space-y-6"
          id="store-settings-form"
        >
          {/* Logo Upload */}
          <div>
            <Label className="text-sm font-medium">Store Logo</Label>
            <div className="mt-2">
              {logo ? (
                <div className="relative inline-block">
                  <Image
                    src={logo}
                    alt="Store logo"
                    className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg lg:w-40 lg:h-40"
                    unoptimized
                    width={160}
                    height={160}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-11 h-11 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    aria-label="Remove logo"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera size={32} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm lg:text-base text-gray-600 mb-2">
                        Upload your store logo
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        Max 5MB • Will be compressed to 100KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full mt-3 gap-2"
              size="lg"
            >
              <Upload size={20} />
              {uploading ? "Processing..." : logo ? "Change Logo" : "Upload Logo"}
            </Button>
          </div>

          {/* Store Name & Code */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="storeName" className="text-sm font-medium">Store Name *</Label>
              <Input
                id="storeName"
                {...form.register("name")}
                placeholder="Enter your store name"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeCode" className="text-sm font-medium">Store Code *</Label>
              <Input
                id="storeCode"
                {...form.register("storeCode")}
                placeholder="ABC"
                maxLength={6}
                className="uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  form.setValue("storeCode", e.target.value);
                }}
              />
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                2-6 uppercase letters/numbers for invoice numbering
              </p>
              {form.formState.errors.storeCode && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.storeCode.message}
                </p>
              )}
            </div>
          </div>

          {/* Store Description */}
          <div>
            <Label htmlFor="storeDescription" className="text-sm font-medium">Store Description</Label>
            <Textarea
              id="storeDescription"
              {...form.register("storeDescription")}
              placeholder="Describe your store, products, or services"
              rows={3}
            />
          </div>

          {/* Tagline & Store Number */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="tagline" className="text-sm font-medium">Tagline</Label>
              <Input
                id="tagline"
                {...form.register("tagline")}
                placeholder="e.g., Quality products for everyone"
              />
            </div>

            <div>
              <Label htmlFor="storeNumber" className="text-sm font-medium">Store Number / ID</Label>
              <Input
                id="storeNumber"
                {...form.register("storeNumber")}
                placeholder="Internal reference number"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address" className="text-sm font-medium">Store Address *</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="Enter your store address"
              rows={4}
            />
            {form.formState.errors.address && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp Number *</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">+62</span>
                <Input
                  id="whatsapp"
                  type="tel"
                  {...form.register("whatsapp")}
                  placeholder="812345678"
                  className="flex-1"
                />
              </div>
              {form.formState.errors.whatsapp && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.whatsapp.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                placeholder="021-12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Contact Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="store@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <Input
                id="website"
                type="url"
                {...form.register("website")}
                placeholder="https://yourstore.com"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentMethod" className="text-sm font-medium">Preferred Payment Method</Label>
            <Input
              id="paymentMethod"
              {...form.register("paymentMethod")}
              placeholder="e.g., Bank Transfer BCA a/n PT Company"
            />
          </div>

          {/* Brand Color & Invoice Prefix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="brandColor" className="text-sm font-medium">Brand Color *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="brandColor"
                  type="color"
                  value={form.watch("brandColor")}
                  onChange={(e) => form.setValue("brandColor", e.target.value)}
                  className="w-20 h-12 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  {...form.register("brandColor")}
                  placeholder="#10b981"
                  className="flex-1"
                  maxLength={7}
                />
              </div>
              {form.formState.errors.brandColor && (
                <p className="text-xs text-red-600 mt-1">
                  {form.formState.errors.brandColor.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="invoicePrefix" className="text-sm font-medium">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                {...form.register("invoicePrefix")}
                placeholder="INV"
                maxLength={10}
              />
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                Used in invoice numbers (e.g., INV-ABC-20251031-001)
              </p>
            </div>
          </div>
        </form>
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
            form="store-settings-form"
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            size="lg"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Store Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
