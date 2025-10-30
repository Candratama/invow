"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  hasLocalDataToSync,
  getLocalDataSummary,
  syncLocalDataToSupabase,
} from "@/lib/db/local-sync";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    success: boolean;
    syncedSettings: boolean;
    syncedInvoices: number;
    errors: string[];
  } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);

      // Check if there's local data to sync
      if (hasLocalDataToSync()) {
        const dataSummary = getLocalDataSummary();
        console.log("Local data found to sync:", dataSummary);

        // Start syncing after a short delay to ensure auth is complete
        setTimeout(async () => {
          setSyncing(true);
          try {
            const results = await syncLocalDataToSupabase();
            setSyncResults(results);
            console.log("Sync results:", results);
          } catch (syncError) {
            console.error("Sync failed:", syncError);
            setSyncResults({
              success: false,
              syncedSettings: false,
              syncedInvoices: 0,
              errors: [
                syncError instanceof Error
                  ? syncError.message
                  : "Unknown sync error",
              ],
            });
          } finally {
            setSyncing(false);
            // Redirect after sync completes
            setTimeout(() => router.push("/"), 2000);
          }
        }, 1000);
      } else {
        // No local data to sync, redirect immediately
        setTimeout(() => router.push("/"), 2000);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6 lg:p-8 text-center">
          {!syncing && !syncResults && (
            <>
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <h2 className="text-xl font-bold mb-2">Account Created!</h2>
              <p className="text-gray-600 mb-4">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {syncing && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2">Syncing Your Data...</h2>
              <p className="text-gray-600 mb-4">
                We&apos;re transferring your local invoices to your account.
              </p>
              <div className="text-xs text-gray-500">
                This may take a moment...
              </div>
            </>
          )}

          {syncResults && (
            <>
              <div
                className={`text-4xl mb-4 ${
                  syncResults.success ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {syncResults.success ? "✓" : "⚠️"}
              </div>
              <h2 className="text-xl font-bold mb-2">
                {syncResults.success
                  ? "Setup Complete!"
                  : "Setup Complete with Warnings"}
              </h2>
              <div className="text-sm text-gray-600 mb-4">
                {syncResults.syncedSettings && <div>✅ Settings synced</div>}
                {syncResults.syncedInvoices > 0 && (
                  <div>✅ {syncResults.syncedInvoices} invoices synced</div>
                )}
                {syncResults.errors.length > 0 && (
                  <div className="text-yellow-600 mt-2">
                    ⚠️ {syncResults.errors.length} items had issues
                  </div>
                )}
              </div>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Sign up to sync your invoices across devices
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
