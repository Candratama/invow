"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AccountPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading account..." />;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    if (
      confirm(
        "Are you sure you want to sign out?",
      )
    ) {
      await signOut();
      router.push("/");
    }
  };

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Account Settings
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 lg:px-6 lg:py-8">
        {/* Account Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="text"
                value={user.email || ""}
                disabled
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600"
              />
            </div>
          </div>
        </div>

        
        {/* Sign Out */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-red-600">Sign Out</h2>
          <p className="text-sm text-gray-600 mb-4">
            You&apos;ll need to log in again to access your account after signing out.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
