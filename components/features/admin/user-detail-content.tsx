"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserDetailCard } from "@/components/features/admin/user-detail-card";
import { UserActions } from "@/components/features/admin/user-actions";
import type { UserDetail } from "@/lib/db/services/admin-users.service";

interface UserDetailContentProps {
  user: UserDetail;
}

/**
 * User detail content component
 * Combines header, actions, and detail card for user detail page
 */
export function UserDetailContent({ user }: UserDetailContentProps) {
  const router = useRouter();

  const handleActionComplete = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{user.email}</h1>
        </div>
      </div>

      {/* User Actions */}
      <UserActions
        userId={user.id}
        currentTier={user.tier}
        currentMonthCount={user.currentMonthCount}
        onActionComplete={handleActionComplete}
      />

      {/* User Detail Card */}
      <UserDetailCard user={user} />
    </div>
  );
}
