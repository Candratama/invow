"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { User } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Link
      href="/dashboard/account"
      className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
      aria-label="Account settings"
    >
      <User size={20} />
    </Link>
  );
}
