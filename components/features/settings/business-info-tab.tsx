"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Camera, Upload, X, Plus, Edit2, Trash2, Star } from "lucide-react";
import type { StoreContact } from "@/lib/db/database.types";
import { compressImage, validateImageFile } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SignatureCanvas } from "@/components/ui/signature-pad";
import SignaturePad from "signature_pad";
import {
  updateStoreAction,
  createContactAction,
  updateContactAction,
  deleteContactAction,
  setPrimaryContactAction,
  getStoreAndContactsAction,
} from "@/app/actions/store";
import { isPremiumAction } from "@/app/actions/subscription";
import { useAuth } from "@/lib/auth/auth-context";
import { FeatureGate } from "@/components/ui/feature-gate";

const optionalText = z.string().optional().or(z.literal(""));

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #10b981)");

const businessInfoSchema = z.object({
  name: z.string().min(3, "Store name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  whatsapp: z.string().min(10, "WhatsApp number must be at least 10 digits"),
  phone: optionalText,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: optionalText,
  storeDescription: optionalText,
  tagline: optionalText,
  storeNumber: optionalText,
  brandColor: hexColorSchema,
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface BusinessInfoTabProps {
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  initialStore?: {
    id: string;
    name?: string | null;
    logo?: string | null;
    address?: string | null;
    whatsapp?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    store_description?: string | null;
    tagline?: string | null;
    store_number?: string | null;
    brand_color?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
  } | null;
  initialContacts?: StoreContact[];
}

export function BusinessInfoTab({
  onClose,
  onDirtyChange,
  initialStore,
  initialContacts = [],
}: BusinessInfoTabProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(!initialStore);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_store, setStore] = useState(initialStore);
  const [isPremium, setIsPremium] = useState(false);

  // State for business info
  const [logo, setLogo] = useState<string>(initialStore?.logo || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for authorized persons
  const [contacts, setContacts] = useState<StoreContact[]>(initialContacts);

  const [isContactEditOpen, setIsContactEditOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<StoreContact | null>(
    null
  );
  const [signature, setSignature] = useState<string>("");
  const [signatureDraft, setSignatureDraft] = useState<string | undefined>();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  const form = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      name: initialStore?.name || "",
      address: initialStore?.address || "",
      whatsapp: initialStore?.whatsapp?.replace(/^\+62/, "") || "",
      phone: initialStore?.phone || "",
      email: initialStore?.email || "",
      website: initialStore?.website || "",
      storeDescription: initialStore?.store_description || "",
      tagline: initialStore?.tagline || "",
      storeNumber: initialStore?.store_number || "",
      brandColor: initialStore?.brand_color || "#10b981",
      primaryColor: initialStore?.primary_color || "#000000",
      secondaryColor: initialStore?.secondary_color || "#666666",
      accentColor: initialStore?.accent_color || "#0066cc",
    },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      title: "",
    },
  });

  // Fetch store data on mount if not provided
  useEffect(() => {
    if (!initialStore) {
      startTransition(async () => {
        setIsLoading(true);
        const result = await getStoreAndContactsAction();
        if (result.success && result.data) {
          setStore(result.data.store);
          setContacts(result.data.contacts);
          if (result.data.store) {
            setLogo(result.data.store.logo || "");
            form.reset({
              name: result.data.store.name || "",
              address: result.data.store.address || "",
              whatsapp: result.data.store.whatsapp?.replace(/^\+62/, "") || "",
              phone: result.data.store.phone || "",
              email: result.data.store.email || "",
              website: result.data.store.website || "",
              storeDescription: result.data.store.store_description || "",
              tagline: result.data.store.tagline || "",
              storeNumber: result.data.store.store_number || "",
              brandColor: result.data.store.brand_color || "#10b981",
              primaryColor: result.data.store.primary_color || "#000000",
              secondaryColor: result.data.store.secondary_color || "#666666",
              accentColor: result.data.store.accent_color || "#0066cc",
            });
          }
        }
        setIsLoading(false);
      });
    }
  }, [form, initialStore]);

  // Fetch premium status on mount
  useEffect(() => {
    const fetchPremiumStatus = async () => {
      const result = await isPremiumAction();
      if (result.data !== undefined) {
        setIsPremium(result.data);
      }
    };
    fetchPremiumStatus();
  }, []);

  // Track form dirty state
  useEffect(() => {
    if (onDirtyChange) {
      const isDirty = form.formState.isDirty;
      onDirtyChange(isDirty);
    }
  }, [form.formState.isDirty, onDirtyChange]);

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const validation = await validateImageFile(file, {
        maxSizeKB: 5000,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
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

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact(null);
    setSignature("");
    setSignatureDraft(undefined);
    contactForm.reset({ name: "", title: "" });
    setIsContactEditOpen(true);
  };

  const handleEditContact = (contact: StoreContact) => {
    setEditingContact(contact);
    setSignature(contact.signature || "");
    setSignatureDraft(contact.signature || undefined);
    contactForm.reset({
      name: contact.name,
      title: contact.title || "",
    });
    setIsContactEditOpen(true);
  };

  const handleDeleteContact = async (contact: StoreContact) => {
    if (!window.confirm(`Delete contact "${contact.name}"?`)) return;

    startTransition(async () => {
      try {
        const result = await deleteContactAction(contact.id);
        if (!result.success) {
          toast.error(result.error || "Failed to delete contact");
          return;
        }

        // Update local state
        setContacts(contacts.filter((c) => c.id !== contact.id));
        toast.success("Contact deleted successfully!");
      } catch (error) {
        console.error("Error deleting contact:", error);
        toast.error("Failed to delete contact. Please try again.");
      }
    });
  };

  const handleSetPrimary = async (contact: StoreContact) => {
    if (!initialStore?.id) return;
    startTransition(async () => {
      try {
        const result = await setPrimaryContactAction(
          initialStore.id,
          contact.id
        );
        if (!result.success) {
          toast.error(result.error || "Failed to set primary contact");
          return;
        }

        // Update local state
        setContacts(
          contacts.map((c) => ({
            ...c,
            is_primary: c.id === contact.id,
          }))
        );
        toast.success("Primary contact updated!");
      } catch (error) {
        console.error("Error setting primary contact:", error);
        toast.error("Failed to set primary contact. Please try again.");
      }
    });
  };

  const handleOpenSignatureSheet = (initial?: string) => {
    setSignatureDraft(initial);
    setIsSignatureSheetOpen(true);
  };

  const handleCloseSignatureSheet = () => {
    setSignatureDraft(signature || undefined);
    setIsSignatureSheetOpen(false);
  };

  const handleSaveSignatureDraft = async () => {
    let latestSignature = signatureDraft;
    if (!latestSignature && signaturePadRef.current) {
      if (signaturePadRef.current.isEmpty()) {
        toast.error("Please draw a signature first.");
        return;
      }
      // Get signature as data URL
      const signatureDataURL = signaturePadRef.current.toDataURL("image/png");

      // Compress signature to reduce size
      try {
        // Convert data URL to blob
        const response = await fetch(signatureDataURL);
        const blob = await response.blob();
        const file = new File([blob], "signature.png", { type: "image/png" });

        // Compress to 50KB max
        latestSignature = await compressImage(file, 50);
      } catch (error) {
        console.error("Error compressing signature:", error);
        // Fallback to original if compression fails
        latestSignature = signatureDataURL;
      }
    }
    if (!latestSignature) {
      toast.error("Please draw a signature first.");
      return;
    }
    setSignature(latestSignature);
    setSignatureDraft(latestSignature);
    setIsSignatureSheetOpen(false);
  };

  const onContactSubmit = async (data: ContactFormData) => {
    startTransition(async () => {
      try {
        if (editingContact) {
          const result = await updateContactAction(editingContact.id, {
            name: data.name,
            title: data.title || undefined,
            signature: signature || undefined,
          });

          if (!result.success) {
            toast.error(result.error || "Failed to update contact");
            return;
          }

          // Update local state
          setContacts(
            contacts.map((c) =>
              c.id === editingContact.id
                ? {
                    ...c,
                    name: data.name,
                    title: data.title || null,
                    signature: signature || null,
                  }
                : c
            )
          );
          toast.success("Contact updated successfully!");
        } else {
          const result = await createContactAction({
            name: data.name,
            title: data.title || undefined,
            signature: signature || undefined,
            phone: "", // Required by action but not used in this form
          });

          if (!result.success) {
            toast.error(result.error || "Failed to add contact");
            return;
          }

          // Add to local state
          if (result.data) {
            setContacts([...contacts, result.data]);
          }
          toast.success("Contact added successfully!");
        }

        setIsContactEditOpen(false);
        setEditingContact(null);
        contactForm.reset();
        setSignature("");
      } catch (error) {
        console.error("Error saving contact:", error);
        toast.error("Failed to save contact. Please try again.");
      }
    });
  };

  // Business info submit handler
  const onSubmit = async (data: BusinessInfoFormData) => {
    // Format WhatsApp
    let whatsapp = data.whatsapp.replace(/\D/g, "");
    if (whatsapp.startsWith("0")) {
      whatsapp = "62" + whatsapp.substring(1);
    } else if (!whatsapp.startsWith("62")) {
      whatsapp = "62" + whatsapp;
    }

    const sanitize = (val?: string) => {
      const trimmed = val?.trim();
      return trimmed || undefined;
    };

    startTransition(async () => {
      try {
        const result = await updateStoreAction({
          name: data.name,
          logo: logo || undefined,
          address: data.address,
          whatsapp: "+" + whatsapp,
          phone: sanitize(data.phone),
          email: sanitize(data.email),
          website: sanitize(data.website),
          storeDescription: sanitize(data.storeDescription),
          tagline: sanitize(data.tagline),
          storeNumber: sanitize(data.storeNumber),
          brandColor: data.brandColor,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
        });

        if (!result.success) {
          toast.error(result.error || "Failed to save business info");
          return;
        }

        // Reset form with current values to clear dirty state
        form.reset(data);

        // Reset dirty state
        if (onDirtyChange) {
          onDirtyChange(false);
        }

        toast.success("Business info saved successfully!");
      } catch (error) {
        console.error("Error saving business info:", error);
        toast.error("Failed to save business info. Please try again.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-gray-600">Loading business info...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4 space-y-4 sm:space-y-6 lg:py-8">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="lg:max-w-3xl lg:mx-auto space-y-4 sm:space-y-6"
            id="business-info-form"
          >
            {/* Account Section */}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Account
              </h2>
              <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
                <Label htmlFor="userEmail" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 bg-gray-50 cursor-not-allowed min-h-[44px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your account email cannot be changed here
                </p>
              </div>
            </div>

            {/* Company Details Section */}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Company Details
              </h2>
              <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="storeName" className="text-sm font-medium">
                    Store Name *
                  </Label>
                  <Input
                    id="storeName"
                    {...form.register("name")}
                    placeholder="Enter your store name"
                    className="min-h-[44px]"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="storeDescription"
                    className="text-sm font-medium"
                  >
                    Store Description
                  </Label>
                  <Textarea
                    id="storeDescription"
                    {...form.register("storeDescription")}
                    placeholder="Describe your store, products, or services"
                    rows={3}
                    className="min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="storeNumber"
                      className="text-sm font-medium"
                    >
                      Store Number / ID
                    </Label>
                    <Input
                      id="storeNumber"
                      {...form.register("storeNumber")}
                      placeholder="Internal reference number"
                      className="min-h-[44px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tagline" className="text-sm font-medium">
                      Tagline
                    </Label>
                    <Input
                      id="tagline"
                      {...form.register("tagline")}
                      placeholder="e.g., Quality products for everyone"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    Store Address *
                  </Label>
                  <Textarea
                    id="address"
                    {...form.register("address")}
                    placeholder="Enter your store address"
                    rows={4}
                    className="min-h-[44px]"
                  />
                  {form.formState.errors.address && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="whatsapp" className="text-sm font-medium">
                      WhatsApp Number *
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">+62</span>
                      <Input
                        id="whatsapp"
                        type="tel"
                        {...form.register("whatsapp")}
                        placeholder="812345678"
                        className="flex-1 min-h-[44px]"
                      />
                    </div>
                    {form.formState.errors.whatsapp && (
                      <p className="text-xs text-red-600 mt-1">
                        {form.formState.errors.whatsapp.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="021-12345678"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Contact Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="store@example.com"
                      className="min-h-[44px]"
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-red-600 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-sm font-medium">
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      {...form.register("website")}
                      placeholder="https://yourstore.com"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Branding Section */}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Branding
              </h2>
              <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                <FeatureGate feature="hasLogo" hasAccess={isPremium}>
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
                      className="w-full mt-3 gap-2 min-h-[44px]"
                      size="lg"
                    >
                      <Upload size={20} />
                      {uploading
                        ? "Processing..."
                        : logo
                        ? "Change Logo"
                        : "Upload Logo"}
                    </Button>
                  </div>
                </FeatureGate>

                <FeatureGate
                  feature="hasBrandColor"
                  hasAccess={isPremium}
                  fallback={
                    <div>
                      <Label
                        htmlFor="brandColor"
                        className="text-sm font-medium"
                      >
                        Brand Color
                      </Label>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2">
                        <Input
                          id="brandColor-locked"
                          type="color"
                          value="#d4af37"
                          disabled
                          className="w-16 sm:w-20 h-11 sm:h-12 p-1 cursor-not-allowed opacity-70"
                        />
                        <Input
                          type="text"
                          value="#d4af37"
                          disabled
                          placeholder="#d4af37"
                          className="flex-1 min-h-[44px] cursor-not-allowed opacity-70"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Default gold color. Upgrade to Premium to customize.
                      </p>
                    </div>
                  }
                >
                  <div>
                    <Label htmlFor="brandColor" className="text-sm font-medium">
                      Brand Color *
                    </Label>
                    <div className="flex items-center gap-2 sm:gap-3 mt-2">
                      <Input
                        id="brandColor"
                        type="color"
                        value={form.watch("brandColor")}
                        onChange={(e) =>
                          form.setValue("brandColor", e.target.value)
                        }
                        className="w-16 sm:w-20 h-11 sm:h-12 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        {...form.register("brandColor")}
                        placeholder="#10b981"
                        className="flex-1 min-h-[44px]"
                        maxLength={7}
                      />
                    </div>
                    {form.formState.errors.brandColor && (
                      <p className="text-xs text-red-600 mt-1">
                        {form.formState.errors.brandColor.message}
                      </p>
                    )}
                  </div>
                </FeatureGate>
              </div>
            </div>

            {/* Authorized Person Section */}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">
                Authorized Person
              </h2>
              <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Manage people authorized to sign invoices
                  </p>
                  <Button
                    onClick={handleAddContact}
                    size="sm"
                    className="gap-2 w-full sm:w-auto min-h-[44px]"
                  >
                    <Plus size={16} />
                    Add Signature
                  </Button>
                </div>

                {contacts.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-3 sm:mb-4">
                      No contacts yet
                    </p>
                    <Button
                      onClick={handleAddContact}
                      variant="outline"
                      className="min-h-[44px]"
                    >
                      Add Your First Contact
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base lg:text-lg font-medium">
                                {contact.name}
                              </h4>
                              {contact.is_primary && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  <Star size={12} fill="currentColor" />
                                  Primary
                                </span>
                              )}
                            </div>
                            {contact.title && (
                              <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                                {contact.title}
                              </p>
                            )}
                            {contact.signature && (
                              <div className="mt-2 p-3 border rounded bg-gray-50">
                                <Image
                                  src={contact.signature}
                                  alt={`${contact.name} signature`}
                                  className="h-16 sm:h-20 lg:h-24 object-contain w-full"
                                  unoptimized
                                  width={200}
                                  height={96}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            {!contact.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(contact)}
                                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-primary transition-colors rounded-md hover:bg-gray-100"
                                title="Set as primary"
                                aria-label="Set as primary contact"
                              >
                                <Star
                                  size={16}
                                  className="sm:w-[18px] sm:h-[18px]"
                                />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-primary transition-colors rounded-md hover:bg-gray-100"
                              title="Edit"
                              aria-label="Edit contact"
                            >
                              <Edit2
                                size={16}
                                className="sm:w-[18px] sm:h-[18px]"
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact)}
                              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100"
                              title="Delete"
                              aria-label="Delete contact"
                            >
                              <Trash2
                                size={16}
                                className="sm:w-[18px] sm:h-[18px]"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              form="business-info-form"
              className="flex-1 bg-primary text-white hover:bg-primary/90 min-h-[44px]"
              size="lg"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Business Info"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit/Add Contact Sheet */}
      <BottomSheet
        isOpen={isContactEditOpen}
        onClose={() => {
          setIsContactEditOpen(false);
          setEditingContact(null);
        }}
        title={editingContact ? "Edit Contact" : "Add Contact"}
        maxWidth="md"
      >
        <div className="p-4 pb-6">
          <form
            onSubmit={contactForm.handleSubmit(onContactSubmit)}
            className="space-y-4"
            id="contact-form"
          >
            <div>
              <Label htmlFor="contactName" className="text-sm font-medium">
                Name *
              </Label>
              <Input
                id="contactName"
                {...contactForm.register("name")}
                placeholder="Enter contact name"
              />
              {contactForm.formState.errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {contactForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="contactTitle" className="text-sm font-medium">
                Title / Position
              </Label>
              <Input
                id="contactTitle"
                {...contactForm.register("title")}
                placeholder="e.g., Owner, Manager, Admin"
              />
            </div>

            {/* Signature */}
            <FeatureGate feature="hasSignature" hasAccess={isPremium}>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Signature</Label>
                {signature ? (
                  <div className="border rounded-lg bg-white p-4 flex flex-col items-center gap-3">
                    <Image
                      src={signature}
                      alt="Contact signature"
                      className="max-w-full h-24 object-contain"
                      unoptimized
                      width={300}
                      height={96}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSignatureSheet(signature)}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove signature? You can add it later."
                            )
                          ) {
                            setSignature("");
                            setSignatureDraft(undefined);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenSignatureSheet(undefined)}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-medium">Add Signature</span>
                  </button>
                )}
              </div>
            </FeatureGate>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsContactEditOpen(false);
                  setEditingContact(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="contact-form"
                className="flex-1"
                disabled={isPending}
              >
                {isPending
                  ? "Saving..."
                  : editingContact
                  ? "Update"
                  : "Add Contact"}
              </Button>
            </div>
          </form>
        </div>
      </BottomSheet>

      {/* Signature Sheet */}
      <BottomSheet
        isOpen={isSignatureSheetOpen}
        onClose={handleCloseSignatureSheet}
        title="Draw Signature"
        maxWidth="md"
      >
        <div className="p-4 pb-6 space-y-4">
          <div className="flex justify-center w-full overflow-x-auto">
            <SignatureCanvas
              value={signatureDraft}
              onChange={(dataUrl) => setSignatureDraft(dataUrl)}
              width={320}
              height={180}
              responsive={false}
              onReady={(pad) => {
                signaturePadRef.current = pad;
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">
              Draw your signature in the canvas above.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCloseSignatureSheet}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSaveSignatureDraft}
            >
              Save Signature
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
