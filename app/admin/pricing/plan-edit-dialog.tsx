"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";
import { updateSubscriptionPlanAction } from "@/app/actions/admin-pricing";
import type { SubscriptionPlan } from "@/lib/db/data-access/subscription-plans";

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  invoiceLimit: z.coerce.number().min(-1, "Use -1 for unlimited"),
  duration: z.coerce.number().min(0, "Duration must be 0 or greater"),
  templateCount: z.coerce.number().min(-1, "Use -1 for unlimited"),
  historyLimit: z.coerce.number().min(-1, "Use -1 for unlimited"),
  historyType: z.enum(["count", "days"]),
  hasLogo: z.boolean(),
  hasSignature: z.boolean(),
  hasCustomColors: z.boolean(),
  hasDashboardTotals: z.boolean(),
  hasMonthlyReport: z.boolean(),
  isActive: z.boolean(),
  isPopular: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanEditDialogProps {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PlanEditDialog({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: PlanEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [exportQualities, setExportQualities] = useState<string[]>([]);

  const AVAILABLE_QUALITIES = ["standard", "high", "print-ready"];

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      invoiceLimit: 30,
      duration: 30,
      templateCount: 1,
      historyLimit: 10,
      historyType: "count",
      hasLogo: false,
      hasSignature: false,
      hasCustomColors: false,
      hasDashboardTotals: false,
      hasMonthlyReport: false,
      isActive: true,
      isPopular: false,
    },
  });

  // Reset form when plan changes
  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        price: plan.price,
        invoiceLimit: plan.invoiceLimit,
        duration: plan.duration,
        templateCount: plan.tierFeatures.templateCount,
        historyLimit: plan.tierFeatures.historyLimit,
        historyType: plan.tierFeatures.historyType,
        hasLogo: plan.tierFeatures.hasLogo,
        hasSignature: plan.tierFeatures.hasSignature,
        hasCustomColors: plan.tierFeatures.hasCustomColors,
        hasDashboardTotals: plan.tierFeatures.hasDashboardTotals,
        hasMonthlyReport: plan.tierFeatures.hasMonthlyReport,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
      });
      setFeatures(plan.features);
      setExportQualities(plan.tierFeatures.exportQualities);
    }
  }, [plan, form]);

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const toggleQuality = (quality: string) => {
    setExportQualities((prev) =>
      prev.includes(quality)
        ? prev.filter((q) => q !== quality)
        : [...prev, quality]
    );
  };

  const onSubmit = async (values: PlanFormValues) => {
    if (!plan) return;

    setIsLoading(true);
    try {
      const result = await updateSubscriptionPlanAction(plan.id, {
        ...values,
        features,
        exportQualities,
      });

      if (result.success) {
        onSuccess();
      } else {
        form.setError("root", { message: result.error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Plan: {plan?.name}</DialogTitle>
          <DialogDescription>
            Update harga dan fitur untuk tier {plan?.tier}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Plan</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga (IDR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Limit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>-1 untuk unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hari)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>0 untuk forever</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>-1 untuk unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="historyLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>History Limit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>-1 untuk unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="historyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>History Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="count">Count (jumlah item)</SelectItem>
                      <SelectItem value="days">Days (hari)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Boolean Features */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Fitur Akses</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "hasLogo", label: "Custom Logo" },
                  { name: "hasSignature", label: "Signature" },
                  { name: "hasCustomColors", label: "Custom Colors" },
                  { name: "hasDashboardTotals", label: "Dashboard Totals" },
                  { name: "hasMonthlyReport", label: "Monthly Report" },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={item.name as keyof PlanFormValues}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Export Qualities */}
            <div className="space-y-3">
              <Label>Export Qualities</Label>
              <div className="space-y-2">
                {AVAILABLE_QUALITIES.map((quality) => (
                  <div key={quality} className="flex items-center gap-2">
                    <Checkbox
                      id={`quality-${quality}`}
                      checked={exportQualities.includes(quality)}
                      onCheckedChange={() => toggleQuality(quality)}
                    />
                    <label
                      htmlFor={`quality-${quality}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {quality}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-2">
              <Label>Daftar Fitur (untuk display)</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Tambah fitur baru"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addFeature}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-muted p-2 rounded-md"
                  >
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFeature(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="flex gap-6 border-t pt-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Popular</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
