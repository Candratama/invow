"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Upload, X } from "lucide-react";
import { useInvoiceStore } from "@/lib/store";
import { compressImage } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "./bottom-sheet";

const settingsSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  whatsapp: z.string().min(10, "WhatsApp number must be at least 10 digits"),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminTitle: z.string().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #10b981)"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { storeSettings, setStoreSettings } = useInvoiceStore();
  const [logo, setLogo] = useState<string>(storeSettings?.logo || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: storeSettings?.name || "",
      address: storeSettings?.address || "",
      whatsapp: storeSettings?.whatsapp?.replace("+62", "") || "",
      adminName: storeSettings?.adminName || "",
      adminTitle: storeSettings?.adminTitle || "Admin Store",
      brandColor: storeSettings?.brandColor || "#d4af37",
    },
  });

  // Update form when settings change or modal opens
  useEffect(() => {
    if (isOpen && storeSettings) {
      form.reset({
        name: storeSettings.name || "",
        address: storeSettings.address || "",
        whatsapp: storeSettings.whatsapp?.replace("+62", "") || "",
        adminName: storeSettings.adminName || "",
        adminTitle: storeSettings.adminTitle || "Admin Store",
        brandColor: storeSettings.brandColor || "#d4af37",
      });
      setLogo(storeSettings.logo || "");
    }
  }, [isOpen, storeSettings, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      // Compress image to max 100KB
      const compressed = await compressImage(file, 100);
      setLogo(compressed);
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("Failed to process image. Please try another image.");
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

  const onSubmit = (data: SettingsFormData) => {
    // Format WhatsApp number (add +62 if not present)
    let whatsapp = data.whatsapp.replace(/\D/g, ""); // Remove non-digits
    if (whatsapp.startsWith("0")) {
      whatsapp = "62" + whatsapp.substring(1);
    } else if (!whatsapp.startsWith("62")) {
      whatsapp = "62" + whatsapp;
    }

    const newSettings = {
      name: data.name,
      logo: logo,
      address: data.address,
      whatsapp: "+" + whatsapp,
      adminName: data.adminName,
      adminTitle: data.adminTitle?.trim() || "Store Admin",
      brandColor: data.brandColor,
      lastUpdated: new Date().toISOString() as any,
    };

    console.log("💾 Saving settings:", newSettings);
    setStoreSettings(newSettings);

    // Verify save
    setTimeout(() => {
      const saved = localStorage.getItem("invoice-storage");
      console.log(
        "✅ Verified in localStorage:",
        saved ? "Data exists" : "No data!",
      );
    }, 100);

    alert("Settings saved successfully!");
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Store Settings"
      fullScreen
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-4 pb-16 space-y-6"
      >
        {/* Logo Upload */}
        <div>
          <Label>Store Logo</Label>
          <div className="mt-2">
            {logo ? (
              <div className="relative inline-block">
                <img
                  src={logo}
                  alt="Store logo"
                  className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  aria-label="Remove logo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Camera size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Upload your store logo
                    </p>
                    <p className="text-xs text-gray-500">
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

        {/* Store Name */}
        <div>
          <Label htmlFor="storeName">Store Name *</Label>
          <Input
            id="storeName"
            {...form.register("name")}
            placeholder="Enter your store name"
            className="text-lg"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Admin Name */}
        <div>
          <Label htmlFor="adminName">Admin Name (Signature) *</Label>
          <Input
            id="adminName"
            {...form.register("adminName")}
            placeholder="Your name for PDF signature"
          />
          <p className="text-xs text-gray-500 mt-1">
            This will appear as a signature on generated PDFs
          </p>
          {form.formState.errors.adminName && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.adminName.message}
            </p>
          )}
        </div>

        {/* Admin Title */}
        <div>
          <Label htmlFor="adminTitle">Admin Title / Position</Label>
          <Input
            id="adminTitle"
            {...form.register("adminTitle")}
            placeholder="e.g., Kepala Operasional"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ditampilkan di bawah tanda tangan. Kosongkan untuk menggunakan
            default "Store Admin".
          </p>
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address">Store Address *</Label>
          <Textarea
            id="address"
            {...form.register("address")}
            placeholder="Enter your store address"
            rows={4}
          />
          {form.formState.errors.address && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.address.message}
            </p>
          )}
        </div>

        {/* Brand Color */}
        <div>
          <Label htmlFor="brandColor">Brand Color *</Label>
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
              placeholder="#d4af37"
              className="flex-1"
              maxLength={7}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This color will be used throughout the app and in generated PDFs
          </p>
          {form.formState.errors.brandColor && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.brandColor.message}
            </p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <Label htmlFor="whatsapp">WhatsApp Number *</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">+62</span>
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              {...form.register("whatsapp")}
              placeholder="812345678"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter without country code (e.g., 812345678)
          </p>
          {form.formState.errors.whatsapp && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.whatsapp.message}
            </p>
          )}
        </div>

        {/* Spacer for mobile keyboard */}
        <div className="h-24"></div>
      </form>

      {/* Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white pt-4 pb-safe border-t border-gray-200 px-4 z-50">
        <div className="flex gap-3 pb-4">
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
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1"
            size="lg"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
