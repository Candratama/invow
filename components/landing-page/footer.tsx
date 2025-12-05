"use cache";

import { Logo } from "@/components/ui/logo";

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-6">
            <Logo size={32} className="[&>span]:text-white" />
          </div>
          <p className="text-sm text-gray-400 text-center">
            © {currentYear} Invow. With love untuk UMKM Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
