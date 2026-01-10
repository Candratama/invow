"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, XCircle } from "lucide-react";

interface PaymentWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Modal warning sebelum redirect ke halaman pembayaran Mayar.
 * Mengingatkan user untuk tidak menutup browser sebelum proses selesai.
 */
export default function PaymentWarningModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: PaymentWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Instruksi Pembayaran</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Harap baca instruksi berikut sebelum melanjutkan pembayaran.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Warning Box */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              Setelah pembayaran berhasil, Anda akan diarahkan kembali ke
              halaman ini secara otomatis.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">JANGAN</strong> tutup browser atau tab sebelum kembali ke Invow
                </p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">JANGAN</strong> navigate ke halaman lain selama proses pembayaran
                </p>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <p className="text-xs text-muted-foreground">
            Jika terjadi masalah setelah pembayaran, hubungi support dengan
            menyertakan bukti transfer.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              "Memproses..."
            ) : (
              <>
                Lanjutkan ke Pembayaran
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
