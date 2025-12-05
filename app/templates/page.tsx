"use cache";

import { cacheTag } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";
import { getActiveTemplates } from "@/lib/data/templates";
import { CacheTags } from "@/lib/cache/tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Templates listing page with cache
 * Pre-rendered and cached for fast loading
 * Tagged with 'templates' for targeted invalidation
 *
 * Requirements: 7.1, 7.2
 */
export default async function TemplatesPage() {
  cacheTag(CacheTags.TEMPLATES);

  const templates = await getActiveTemplates();
  const activeTemplates = templates.filter((t) => t.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice Templates
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Choose from our collection of professionally designed invoice
              templates
            </p>
          </div>
        </div>
      </header>

      {/* Templates Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.id}`}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 transition-all hover:shadow-lg hover:border-primary/50">
                {/* Preview Image */}
                <div className="aspect-[3/4] relative bg-gray-100">
                  <Image
                    src={`/template/${template.id}.jpg`}
                    alt={`${template.name} template preview`}
                    fill
                    className="object-cover object-top transition-transform group-hover:scale-105"
                  />
                  {template.tier === "premium" && (
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 shadow-sm"
                      >
                        <Lock className="w-3 h-3" />
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Ready to create professional invoices?
          </p>
          <Link href="/dashboard">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
