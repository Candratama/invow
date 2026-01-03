"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

type PageState = "loading" | "form" | "success" | "error";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Password validation
  const passwordMinLength = 6;
  const isPasswordValid = password.length >= passwordMinLength;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Exchange code for session on mount
  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const code = searchParams.get("code");

      if (!code) {
        setErrorMessage(
          "Link reset password tidak valid. Silakan request ulang dari halaman forgot password."
        );
        setPageState("error");
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Code exchange error:", error);
          if (error.message.includes("expired")) {
            setErrorMessage(
              "Link reset password sudah kadaluarsa. Silakan request ulang dari halaman forgot password."
            );
          } else {
            setErrorMessage(
              "Link reset password tidak valid. Silakan request ulang dari halaman forgot password."
            );
          }
          setPageState("error");
          return;
        }

        // Successfully exchanged code, show password form
        setPageState("form");
      } catch (err) {
        console.error("Unexpected error:", err);
        setErrorMessage("Terjadi kesalahan. Silakan coba lagi.");
        setPageState("error");
      }
    };

    exchangeCodeForSession();
  }, [searchParams, supabase.auth]);

  // Handle password update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!isPasswordValid) {
      setFormError(`Password minimal ${passwordMinLength} karakter`);
      return;
    }

    if (!doPasswordsMatch) {
      setFormError("Password tidak cocok");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setFormError(error.message);
        setIsSubmitting(false);
        return;
      }

      // Success
      setPageState("success");

      // Sign out and redirect to login after 3 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/dashboard/login");
      }, 3000);
    } catch (err) {
      console.error("Update password error:", err);
      setFormError("Gagal mengubah password. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Memverifikasi link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Link Tidak Valid
              </h2>
              <p className="text-sm lg:text-base text-gray-600 mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Link href="/dashboard/forgot-password" className="block">
                  <Button className="w-full" size="lg">
                    Request Link Baru
                  </Button>
                </Link>
                <Link
                  href="/dashboard/login"
                  className="text-sm text-gray-600 hover:text-gray-900 block"
                >
                  Kembali ke Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Password Berhasil Diubah!
              </h2>
              <p className="text-sm lg:text-base text-gray-600 mb-6">
                Password kamu sudah diperbarui. Kamu akan dialihkan ke halaman login...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Buat Password Baru
            </h1>
            <p className="text-gray-600">
              Masukkan password baru untuk akun kamu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <Label htmlFor="password">Password Baru</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password.length > 0 && (
                <p
                  className={`text-xs mt-1 ${
                    isPasswordValid ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {isPasswordValid ? "Password valid" : `Minimal ${passwordMinLength} karakter`}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs mt-1 ${
                    doPasswordsMatch ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {doPasswordsMatch ? "Password cocok" : "Password tidak cocok"}
                </p>
              )}
            </div>

            {/* Error message */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {formError}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isPasswordValid || !doPasswordsMatch}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/dashboard/login"
              className="text-sm lg:text-base text-gray-600 hover:text-gray-900"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
