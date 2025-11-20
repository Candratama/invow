# Zustand Stores

This directory contains global state management stores using Zustand.

## Payment Verification Store

**File:** `payment-verification-store.ts`

Manages payment verification state to prevent duplicate API calls and race conditions.

### Features

- **Duplicate Prevention**: Prevents multiple verification attempts for the same payment
- **State Tracking**: Tracks verifying, verified, and failed payments
- **Concurrent Support**: Handles multiple payments being verified simultaneously
- **Error Handling**: Stores error messages for failed verifications

### Usage

```typescript
import { usePaymentVerificationStore } from '@/lib/stores/payment-verification-store';

function MyComponent() {
  const {
    startVerification,
    completeVerification,
    failVerification,
    isVerifying,
    isVerified,
  } = usePaymentVerificationStore();

  const handleVerify = async (paymentId: string) => {
    // Returns false if already verifying or verified
    if (!startVerification(paymentId)) {
      return;
    }

    try {
      // Make API call
      const result = await verifyPaymentAPI(paymentId);
      
      // Mark as complete
      completeVerification(paymentId);
    } catch (error) {
      // Mark as failed with error message
      failVerification(paymentId, error.message);
    }
  };
}
```

### API

#### Actions

- `startVerification(paymentId: string): boolean` - Start verification, returns false if already verifying/verified
- `completeVerification(paymentId: string): void` - Mark payment as successfully verified
- `failVerification(paymentId: string, error: string): void` - Mark payment as failed with error
- `reset(): void` - Clear all state

#### Queries

- `isVerifying(paymentId: string): boolean` - Check if payment is currently being verified
- `isVerified(paymentId: string): boolean` - Check if payment has been verified
- `hasFailed(paymentId: string): boolean` - Check if payment verification failed
- `getError(paymentId: string): string | undefined` - Get error message for failed payment

### Benefits

1. **No Race Conditions**: Prevents duplicate API calls even with React Strict Mode
2. **Global State**: State persists across component re-renders and remounts
3. **Type Safe**: Full TypeScript support
4. **Testable**: Easy to test with Vitest
5. **Performance**: Minimal re-renders with Zustand's selector pattern
