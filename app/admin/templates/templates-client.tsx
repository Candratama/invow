"use client";

import { useState, useEffect } from "react";
import { Eye, Check, X, Settings2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTemplateAccessRulesAction,
  updateTemplateAccessRuleAction,
} from "@/app/actions/template-access";

interface Template {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  previewImage: string;
  enabled: boolean;
  accessType: "free" | "premium" | "whitelist";
  whitelistEmails: string[];
}

const TEMPLATES: Template[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Professional template with logo and store info",
    isPremium: true,
    previewImage: "/template/classic.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
  {
    id: "simple",
    name: "Simple",
    description: "Ultra-minimal with clean typography",
    isPremium: false,
    previewImage: "/template/simple.jpg",
    enabled: true,
    accessType: "free",
    whitelistEmails: [],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary with bold geometric design",
    isPremium: true,
    previewImage: "/template/modern.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated with serif-inspired typography",
    isPremium: true,
    previewImage: "/template/elegant.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong and impactful with large typography",
    isPremium: true,
    previewImage: "/template/bold.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
  {
    id: "compact",
    name: "Compact",
    description: "Space-efficient with dense information layout",
    isPremium: true,
    previewImage: "/template/compact.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
  {
    id: "creative",
    name: "Creative",
    description: "Unique and artistic with asymmetric layout",
    isPremium: true,
    previewImage: "/template/creative.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Formal and professional with structured layout",
    isPremium: true,
    previewImage: "/template/corporate.jpg",
    enabled: true,
    accessType: "premium",
    whitelistEmails: [],
  },
];

interface TemplatesClientProps {
  initialData: null;
}

export function TemplatesClient({
  initialData: _initialData,
}: TemplatesClientProps) {
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [emailInput, setEmailInput] = useState("");

  // Load templates from database on mount
  useEffect(() => {
    const fetchRules = async () => {
      const result = await getTemplateAccessRulesAction();
      if (result.success && result.data) {
        setTemplates((prev) =>
          prev.map((t) => {
            const rule = result.data?.find(
              (r: { template_id: string }) => r.template_id === t.id
            );
            return rule
              ? {
                  ...t,
                  enabled: rule.enabled,
                  accessType: rule.access_type as
                    | "free"
                    | "premium"
                    | "whitelist",
                  whitelistEmails: rule.whitelist_emails || [],
                }
              : t;
          })
        );
      }
    };
    fetchRules();
  }, []);

  const handleToggleTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const newEnabled = !template.enabled;

    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, enabled: newEnabled } : t))
    );

    // Save to database
    const result = await updateTemplateAccessRuleAction(templateId, {
      enabled: newEnabled,
    });

    if (!result.success) {
      // Rollback on error
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, enabled: !newEnabled } : t
        )
      );
      toast.error(result.error || "Failed to update template");
    }
  };

  const handleOpenSettings = (template: Template) => {
    setEditingTemplate(template);
    setEmailInput("");
  };

  const handleSaveSettings = async () => {
    if (!editingTemplate) return;

    // Save to database
    const result = await updateTemplateAccessRuleAction(editingTemplate.id, {
      access_type: editingTemplate.accessType,
      whitelist_emails: editingTemplate.whitelistEmails,
    });

    if (!result.success) {
      toast.error(result.error || "Failed to save template settings");
      return;
    }

    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              accessType: editingTemplate.accessType,
              whitelistEmails: editingTemplate.whitelistEmails,
            }
          : t
      )
    );

    setEditingTemplate(null);
  };

  const handleAddEmail = () => {
    if (!editingTemplate || !emailInput.trim()) return;

    const email = emailInput.trim().toLowerCase();
    if (editingTemplate.whitelistEmails.includes(email)) {
      return;
    }

    setEditingTemplate({
      ...editingTemplate,
      whitelistEmails: [...editingTemplate.whitelistEmails, email],
    });
    setEmailInput("");
  };

  const handleRemoveEmail = (email: string) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      whitelistEmails: editingTemplate.whitelistEmails.filter(
        (e) => e !== email
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice Templates</h1>
        <p className="text-gray-600 mt-2">
          Manage available invoice templates for users
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {templates.map((template) => {
          const isEnabled = template.enabled;

          return (
            <div key={template.id} className="relative group">
              <div
                className={`w-full overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg ${
                  isEnabled
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 opacity-75"
                }`}
              >
                {/* Preview Image */}
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
                  <Image
                    src={template.previewImage}
                    alt={`${template.name} template preview`}
                    width={400}
                    height={533}
                    className={`w-full h-full object-cover object-top transition-transform group-hover:scale-105 ${
                      !isEnabled ? "grayscale-[30%]" : ""
                    }`}
                  />

                  {/* Disabled Overlay */}
                  {!isEnabled && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="px-2.5 py-1 bg-gray-600 text-white text-xs font-medium rounded-full shadow-md">
                        Disabled
                      </div>
                    </div>
                  )}

                  {/* Preview Button Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg hover:bg-gray-100 pointer-events-auto"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {template.name}
                      {template.accessType === "premium" && (
                        <Badge variant="secondary" className="text-xs">
                          Premium
                        </Badge>
                      )}
                      {template.accessType === "whitelist" && (
                        <Badge variant="outline" className="text-xs">
                          Whitelist
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSettings(template);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Template settings"
                        type="button"
                      >
                        <Settings2 size={14} className="text-gray-500" />
                      </button>
                      <Switch
                        id={`template-${template.id}`}
                        checked={isEnabled}
                        onCheckedChange={() =>
                          handleToggleTemplate(template.id)
                        }
                        className="scale-75"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {template.description}
                  </div>
                  {template.whitelistEmails.length > 0 && (
                    <div className="text-xs text-primary mt-1">
                      {template.whitelistEmails.length} whitelisted email(s)
                    </div>
                  )}
                </div>

                {/* Enabled Badge */}
                {isEnabled && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Settings Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Access Settings</DialogTitle>
            <DialogDescription>
              Configure who can access the {editingTemplate?.name} template
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-6 py-4">
              {/* Access Type */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Access Type
                </Label>
                <RadioGroup
                  value={editingTemplate.accessType}
                  onValueChange={(value) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      accessType: value as "free" | "premium" | "whitelist",
                    })
                  }
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                    <RadioGroupItem value="free" id="access-free" />
                    <div className="flex-1">
                      <Label
                        htmlFor="access-free"
                        className="font-medium cursor-pointer"
                      >
                        Free (All Users)
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Available to all users regardless of subscription
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                    <RadioGroupItem value="premium" id="access-premium" />
                    <div className="flex-1">
                      <Label
                        htmlFor="access-premium"
                        className="font-medium cursor-pointer"
                      >
                        Premium Only
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Only available to users with premium subscription
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                    <RadioGroupItem value="whitelist" id="access-whitelist" />
                    <div className="flex-1">
                      <Label
                        htmlFor="access-whitelist"
                        className="font-medium cursor-pointer"
                      >
                        Whitelist (Specific Emails)
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Only available to specific email addresses
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Email Whitelist */}
              {editingTemplate.accessType === "whitelist" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Whitelisted Emails
                  </Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleAddEmail} size="sm">
                      Add
                    </Button>
                  </div>

                  {editingTemplate.whitelistEmails.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                      {editingTemplate.whitelistEmails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">{email}</span>
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4 border rounded-lg">
                      No emails added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <button
            onClick={() => setPreviewTemplate(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close preview"
          >
            <X size={24} />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <Image
              src={`/template/${previewTemplate}.jpg`}
              alt={`${
                templates.find((t) => t.id === previewTemplate)?.name
              } template preview`}
              width={800}
              height={1067}
              className="w-full h-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center mt-4 text-white">
              <h3 className="text-xl font-semibold mb-1">
                {templates.find((t) => t.id === previewTemplate)?.name}
              </h3>
              <p className="text-sm text-gray-300">
                {templates.find((t) => t.id === previewTemplate)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
