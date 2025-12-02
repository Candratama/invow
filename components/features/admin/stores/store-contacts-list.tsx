"use client";

import { Users, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreContact } from "@/lib/db/services/admin-stores.service";

interface StoreContactsListProps {
  contacts: StoreContact[];
}

/**
 * Store contacts list component
 * Displays all contacts associated with a store
 */
export function StoreContactsList({ contacts }: StoreContactsListProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Store Contacts
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No contacts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Store Contacts
        <span className="text-sm font-normal text-muted-foreground">
          ({contacts.length})
        </span>
      </h3>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              contact.isPrimary && "bg-primary/5 border-primary/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  contact.isPrimary
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  {contact.name}
                  {contact.isPrimary && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      Primary
                    </span>
                  )}
                </p>
                {contact.title && (
                  <p className="text-sm text-muted-foreground">
                    {contact.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
