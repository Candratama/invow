"use cache";

import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { getActiveTemplates, getTemplateById } from "@/lib/data/templates";
import { CacheTags } from "@/lib/cache/tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Generate static params for all active invoice templates
 * This pre-builds routes for all 8 default templates at build time
 *
 * Requirements: 7.1, 7.4
 */
export async function generateStaticParams() {
  const templates = await getActiveTemplates();
  return templates
    .filter((t) => t.isActive)
    .map((template) => ({
      templateId: template.id,
    }));
}

interface TemplatePageProps {
  params: Promise<{ templateId: string }>;
}

/**
 * Template preview page with cache and cache tag
 * Pre-rendered and cached for fast loading
 * Tagged with 'templates' for targeted invalidation
 *
 * Requirements: 7.1, 7.2, 7.4
 */
export default async function TemplatePage({ params }: TemplatePageProps) {
  cacheTag(CacheTags.TEMPLATES);

  const { templateId } = await params;
  const template = await getTemplateById(templateId);

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/templates">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Templates
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {template.name} Template
                </h1>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {template.tier === "premium" ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Template Preview */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="aspect-[3/4] relative">
            <Image
              src={`/template/${templateId}.jpg`}
              alt={`${template.name} invoice template preview`}
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>

        {/* Template Info */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            About this template
          </h2>
          <p className="text-gray-600 mb-4">{template.description}</p>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Access: </span>
              <span className="font-medium capitalize">{template.tier}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Status: </span>
              <span className="font-medium">
                {template.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button size="lg">Use this template</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
