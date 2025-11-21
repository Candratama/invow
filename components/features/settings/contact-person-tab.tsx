"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Star } from "lucide-react";
import { storeContactsService } from "@/lib/db/services";
import type { StoreContact } from "@/lib/db/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SignatureCanvas } from "@/components/ui/signature-pad";
import SignaturePad from "signature_pad";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeSettingsQueryKey } from "@/lib/hooks/use-store-settings";
import { useDefaultStore } from "@/lib/hooks/use-default-store";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactPersonTabProps {
  onClose: () => void;
}

export function ContactPersonTab({ onClose }: ContactPersonTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _onClose = onClose;
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<StoreContact | null>(
    null,
  );
  const [signature, setSignature] = useState<string>("");
  const [signatureDraft, setSignatureDraft] = useState<string | undefined>();
  const [isSignatureSheetOpen, setIsSignatureSheetOpen] = useState(false);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      title: "",
    },
  });

  // React Query: Fetch store using shared hook
  const { data: storeData } = useDefaultStore();
  const storeId = storeData?.id || null;

  // React Query: Fetch contacts
  const { data: contacts = [], isLoading: loading } = useQuery({
    queryKey: ['store-contacts', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await storeContactsService.getContacts(storeId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation: Create contact
  const createContactMutation = useMutation({
    mutationFn: async (contactData: { store_id: string; name: string; title: string | null; signature: string | null; is_primary: boolean }) => {
      const { data, error } = await storeContactsService.createContact(contactData);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-contacts', storeId] });
      queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
    },
  });

  // Mutation: Update contact
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; title: string | null; signature: string | null } }) => {
      const { error } = await storeContactsService.updateContact(id, data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-contacts', storeId] });
      queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
    },
  });

  // Mutation: Delete contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await storeContactsService.deleteContact(contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-contacts', storeId] });
      queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
    },
  });

  // Mutation: Set primary contact
  const setPrimaryMutation = useMutation({
    mutationFn: async ({ storeId, contactId }: { storeId: string; contactId: string }) => {
      const { error } = await storeContactsService.setPrimaryContact(storeId, contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-contacts', storeId] });
      queryClient.invalidateQueries({ queryKey: storeSettingsQueryKey });
    },
  });

  const handleAddContact = () => {
    setEditingContact(null);
    setSignature("");
    setSignatureDraft(undefined);
    form.reset({ name: "", title: "" });
    setIsEditOpen(true);
  };

  const handleEditContact = (contact: StoreContact) => {
    setEditingContact(contact);
    setSignature(contact.signature || "");
    setSignatureDraft(contact.signature || undefined);
    form.reset({
      name: contact.name,
      title: contact.title || "",
    });
    setIsEditOpen(true);
  };

  const handleDeleteContact = async (contact: StoreContact) => {
    if (!window.confirm(`Delete contact "${contact.name}"?`)) return;

    try {
      await deleteContactMutation.mutateAsync(contact.id);
      toast.success("Contact deleted successfully!");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact. Please try again.");
    }
  };

  const handleSetPrimary = async (contact: StoreContact) => {
    if (!storeId) return;

    try {
      await setPrimaryMutation.mutateAsync({ storeId, contactId: contact.id });
    } catch (error) {
      console.error("Error setting primary contact:", error);
      toast.error("Failed to set primary contact. Please try again.");
    }
  };

  const handleOpenSignatureSheet = (initial?: string) => {
    setSignatureDraft(initial);
    setIsSignatureSheetOpen(true);
  };

  const handleCloseSignatureSheet = () => {
    setSignatureDraft(signature || undefined);
    setIsSignatureSheetOpen(false);
  };

  const handleSaveSignatureDraft = () => {
    let latestSignature = signatureDraft;
    if (!latestSignature && signaturePadRef.current) {
      if (signaturePadRef.current.isEmpty()) {
        toast.error("Please draw a signature first.");
        return;
      }
      latestSignature = signaturePadRef.current.toDataURL("image/png");
    }
    if (!latestSignature) {
      toast.error("Please draw a signature first.");
      return;
    }
    setSignature(latestSignature);
    setSignatureDraft(latestSignature);
    setIsSignatureSheetOpen(false);
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!storeId) {
      toast.error("Store not found. Please refresh and try again.");
      return;
    }

    try {
      if (editingContact) {
        // Update existing contact
        await updateContactMutation.mutateAsync({
          id: editingContact.id,
          data: {
            name: data.name,
            title: data.title || null,
            signature: signature || null,
          },
        });

        toast.success("Contact updated successfully!");
      } else {
        // Create new contact
        await createContactMutation.mutateAsync({
          store_id: storeId,
          name: data.name,
          title: data.title || null,
          signature: signature || null,
          is_primary: contacts.length === 0, // First contact is primary
        });

        toast.success("Contact added successfully!");
      }

      setIsEditOpen(false);
      setEditingContact(null);
      form.reset();
      setSignature("");
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading contacts...</div>
      </div>
    );
  }

  return (
    <>
      <div className="py-4 px-4 space-y-4 lg:py-8 lg:max-w-3xl lg:mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Contact Persons</h3>
            <p className="text-sm text-gray-600">
              Manage store administrators and their signatures
            </p>
          </div>
          <Button onClick={handleAddContact} size="sm" className="gap-2">
            <Plus size={16} />
            Add Contact
          </Button>
        </div>

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No contacts yet</p>
            <Button onClick={handleAddContact} variant="outline">
              Add Your First Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{contact.name}</h4>
                      {contact.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Star size={12} fill="currentColor" />
                          Primary
                        </span>
                      )}
                    </div>
                    {contact.title && (
                      <p className="text-sm text-gray-600">{contact.title}</p>
                    )}
                    {contact.signature && (
                      <div className="mt-2 p-2 border rounded bg-gray-50">
                        <Image
                          src={contact.signature}
                          alt={`${contact.name} signature`}
                          className="h-12 object-contain"
                          unoptimized
                          width={48}
                          height={48}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!contact.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(contact)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Set as primary"
                      >
                        <Star size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Add Contact Sheet */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingContact(null);
        }}
        title={editingContact ? "Edit Contact" : "Add Contact"}
        maxWidth="md"
      >
        <div className="p-4 pb-6">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="contact-form"
          >
            <div>
              <Label htmlFor="contactName">Name *</Label>
              <Input
                id="contactName"
                {...form.register("name")}
                placeholder="Enter contact name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="contactTitle">Title / Position</Label>
              <Input
                id="contactTitle"
                {...form.register("title")}
                placeholder="e.g., Owner, Manager, Admin"
              />
            </div>

            {/* Signature */}
            <div className="space-y-3">
              <Label>Signature</Label>
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
                          window.confirm("Remove signature? You can add it later.")
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
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
                disabled={createContactMutation.isPending || updateContactMutation.isPending}
              >
                {(createContactMutation.isPending || updateContactMutation.isPending) ? "Saving..." : editingContact ? "Update" : "Add Contact"}
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
