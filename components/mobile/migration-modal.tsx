"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "./bottom-sheet";
import { migrationService } from "@/lib/db/migration.service";
import type { MigrationProgress } from "@/lib/db/migration.service";
import type { LocalDataSummary } from "@/lib/db/migration-utils";

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSummary: LocalDataSummary;
  onComplete?: () => void;
}

type MigrationState = "prompt" | "migrating" | "success" | "error";

export function MigrationModal({
  isOpen,
  onClose,
  dataSummary,
  onComplete,
}: MigrationModalProps) {
  const [state, setState] = useState<MigrationState>("prompt");
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    settingsMigrated: boolean;
    draftsMigrated: number;
    completedMigrated: number;
    totalMigrated: number;
  } | null>(null);

  const handleMigrate = async () => {
    setState("migrating");
    setError(null);

    try {
      const result = await migrationService.migrateAllData((prog) => {
        setProgress(prog);
      });

      setSummary(result.summary);

      if (result.error) {
        setState("error");
        setError(result.error.message);
      } else {
        setState("success");
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Migration failed");
    }
  };

  const handleSkip = () => {
    // Mark as migrated so we don't show the modal again
    localStorage.setItem("data-migrated", "skipped");
    onClose();
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    if (progress.total === 0) return 100;
    return Math.round((progress.current / progress.total) * 100);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={state === "migrating" ? () => {} : onClose}
      title={
        state === "prompt"
          ? "Migrate Your Data"
          : state === "migrating"
            ? "Migrating Data..."
            : state === "success"
              ? "Migration Complete!"
              : "Migration Error"
      }
    >
      <div className="space-y-4">
        {/* Prompt State */}
        {state === "prompt" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-3">
                We&apos;ve detected local data on your device. Would you like to
                migrate it to the cloud? This will sync your data across all
                your devices.
              </p>

              <div className="space-y-2 text-sm">
                {dataSummary.hasSettings && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Store settings</span>
                  </div>
                )}
                {dataSummary.hasDrafts && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>{dataSummary.draftCount} draft invoices</span>
                  </div>
                )}
                {dataSummary.hasCompleted && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>{dataSummary.completedCount} completed invoices</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleMigrate} className="w-full" size="lg">
                Migrate to Cloud
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your local data will remain on this device even after migration
            </p>
          </>
        )}

        {/* Migrating State */}
        {state === "migrating" && progress && (
          <>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{progress.message}</span>
                  <span className="font-medium">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Step Indicator */}
              <div className="grid grid-cols-4 gap-2">
                {(["settings", "drafts", "completed", "done"] as const).map(
                  (step) => (
                    <div
                      key={step}
                      className={`text-center p-2 rounded text-xs ${
                        progress.step === step
                          ? "bg-primary text-white"
                          : progress.step === "done" ||
                              ["settings", "drafts", "completed"].indexOf(
                                step,
                              ) <
                                ["settings", "drafts", "completed"].indexOf(
                                  progress.step,
                                )
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {step === "settings"
                        ? "Settings"
                        : step === "drafts"
                          ? "Drafts"
                          : step === "completed"
                            ? "Completed"
                            : "Done"}
                    </div>
                  ),
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Please don&apos;t close this window...
            </p>
          </>
        )}

        {/* Success State */}
        {state === "success" && summary && (
          <>
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">
                Migration Successful!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your data has been successfully migrated to the cloud
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm text-left">
                {summary.settingsMigrated && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Store settings migrated</span>
                  </div>
                )}
                {summary.draftsMigrated > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      {summary.draftsMigrated} draft invoices migrated
                    </span>
                  </div>
                )}
                {summary.completedMigrated > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      {summary.completedMigrated} completed invoices migrated
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={onClose} className="w-full" size="lg">
              Continue
            </Button>
          </>
        )}

        {/* Error State */}
        {state === "error" && (
          <>
            <div className="text-center py-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Migration Error</h3>
              <p className="text-sm text-gray-600 mb-4">
                Some data could not be migrated
              </p>

              {summary && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2 text-sm text-left mb-4">
                  {summary.settingsMigrated && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Store settings migrated</span>
                    </div>
                  )}
                  {summary.draftsMigrated > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>
                        {summary.draftsMigrated} draft invoices migrated
                      </span>
                    </div>
                  )}
                  {summary.completedMigrated > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>
                        {summary.completedMigrated} completed invoices migrated
                      </span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 text-left">
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button onClick={handleMigrate} className="w-full" size="lg">
                Retry Migration
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Continue Anyway
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
