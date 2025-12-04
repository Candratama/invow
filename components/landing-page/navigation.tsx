"use cache";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default async function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo size={32} />
          <Link href="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-sm lg:text-base font-medium">
              Yuk Mulai!
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="ml-2"
                size={16}
                strokeWidth={1.5}
              />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
