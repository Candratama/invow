import { create } from 'zustand';
import { safeLog, maskId } from '@/lib/utils/safe-logger';

/**
 * Payment Verification Store
 * Manages payment verification state to prevent duplicate API calls
 * and handle verification status across components
 */

interface PaymentVerificationState {
  // Track which payment IDs are currently being verified
  verifyingPayments: Set<string>;
  
  // Track which payment IDs have been successfully verified
  verifiedPayments: Set<string>;
  
  // Track which payment IDs have failed verification
  failedPayments: Map<string, string>; // paymentId -> error message
  
  // Actions
  startVerification: (paymentId: string) => boolean;
  completeVerification: (paymentId: string) => void;
  failVerification: (paymentId: string, error: string) => void;
  isVerifying: (paymentId: string) => boolean;
  isVerified: (paymentId: string) => boolean;
  hasFailed: (paymentId: string) => boolean;
  getError: (paymentId: string) => string | undefined;
  reset: () => void;
}

export const usePaymentVerificationStore = create<PaymentVerificationState>((set, get) => ({
  verifyingPayments: new Set(),
  verifiedPayments: new Set(),
  failedPayments: new Map(),

  /**
   * Start verification for a payment
   * Returns false if already verifying or already verified
   */
  startVerification: (paymentId: string) => {
    const state = get();
    
    // Don't start if already verifying
    if (state.verifyingPayments.has(paymentId)) {
      safeLog.info(`Payment ${maskId(paymentId)} is already being verified`);
      return false;
    }
    
    // Don't start if already verified successfully
    if (state.verifiedPayments.has(paymentId)) {
      safeLog.info(`Payment ${maskId(paymentId)} was already verified`);
      return false;
    }
    
    // Start verification
    set((state) => ({
      verifyingPayments: new Set(state.verifyingPayments).add(paymentId),
    }));
    
    safeLog.payment('Started verification', { paymentId });
    return true;
  },

  /**
   * Mark payment as successfully verified
   */
  completeVerification: (paymentId: string) => {
    set((state) => {
      const newVerifying = new Set(state.verifyingPayments);
      newVerifying.delete(paymentId);
      
      const newVerified = new Set(state.verifiedPayments);
      newVerified.add(paymentId);
      
      // Remove from failed if it was there
      const newFailed = new Map(state.failedPayments);
      newFailed.delete(paymentId);
      
      return {
        verifyingPayments: newVerifying,
        verifiedPayments: newVerified,
        failedPayments: newFailed,
      };
    });
    
    safeLog.payment('Completed verification', { paymentId, status: 'verified' });
  },

  /**
   * Mark payment verification as failed
   */
  failVerification: (paymentId: string, error: string) => {
    set((state) => {
      const newVerifying = new Set(state.verifyingPayments);
      newVerifying.delete(paymentId);
      
      const newFailed = new Map(state.failedPayments);
      newFailed.set(paymentId, error);
      
      return {
        verifyingPayments: newVerifying,
        failedPayments: newFailed,
      };
    });
    
    safeLog.error(`Failed verification: ${error}`);
  },

  /**
   * Check if payment is currently being verified
   */
  isVerifying: (paymentId: string) => {
    return get().verifyingPayments.has(paymentId);
  },

  /**
   * Check if payment has been successfully verified
   */
  isVerified: (paymentId: string) => {
    return get().verifiedPayments.has(paymentId);
  },

  /**
   * Check if payment verification has failed
   */
  hasFailed: (paymentId: string) => {
    return get().failedPayments.has(paymentId);
  },

  /**
   * Get error message for failed payment
   */
  getError: (paymentId: string) => {
    return get().failedPayments.get(paymentId);
  },

  /**
   * Reset all state (useful for testing or cleanup)
   */
  reset: () => {
    set({
      verifyingPayments: new Set(),
      verifiedPayments: new Set(),
      failedPayments: new Map(),
    });
    safeLog.info('Reset all verification state');
  },
}));
