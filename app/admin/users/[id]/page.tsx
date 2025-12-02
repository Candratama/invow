"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDetailCard } from "@/components/features/admin/user-detail-card";
import { UserActions } from "@/components/features/admin/user-actions";
import { getUserDetail, type UserDetail } from "@/app/actions/admin";
import { toast } from "sonner";

/**
 * Admin user detail page
 * Displays comprehensive user information and admin actions
 */
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserDetail(userId);
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setError(result.error || "Failed to load user details");
        toast.error(result.error || "Failed to load user details");
      }
    } catch {
      setError("An error occurred while loading user details");
      toast.error("An error occurred while loading user details");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const handleActionComplete = () => {
    fetchUserDetail();
  };

  const handleBack = () => {
    router.push("/admin/users");
  };

  if (error && !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchUserDetail}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          {user && <h1 className="text-2xl font-semibold">{user.email}</h1>}
        </div>
      </div>

      {/* User Actions */}
      {user && (
        <UserActions
          userId={user.id}
          currentTier={user.tier}
          currentMonthCount={user.currentMonthCount}
          onActionComplete={handleActionComplete}
        />
      )}

      {/* User Detail Card */}
      {isLoading ? (
        <UserDetailCard user={{} as UserDetail} isLoading={true} />
      ) : user ? (
        <UserDetailCard user={user} />
      ) : null}
    </div>
  );
}
