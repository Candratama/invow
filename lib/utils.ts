import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting for Indonesian Rupiah
export function formatCurrency(amount: number): string {
  if (typeof window === "undefined") {
    // Server-side: simple format
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }

  // Client-side: use Intl
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }
}

// Date formatting - Simple format that works on server and client
export function formatDate(date: Date): string {
  // Use simple ISO format to avoid hydration issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}

// Date formatting with Intl (client-side only)
export function formatDateLong(date: Date): string {
  if (typeof window === "undefined") {
    // Server-side: use simple format
    return formatDate(date);
  }

  // Client-side: use Intl
  try {
    return new (
      Intl as typeof Intl & { DateFormat: typeof Intl.DateTimeFormat }
    ).DateFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return formatDate(date);
  }
}

// Generate UUID (polyfill for crypto.randomUUID)
export function generateUUID(): string {
  // Try native crypto.randomUUID first
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback to custom implementation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate invoice number with format INV-DDMMYY-{first section of user UUID}-{counter}
// Example: INV-011125-88A60EE2-001
// Uses user's UUID to ensure consistent code across all their invoices
// Counter resets daily and is stored in localStorage
export function generateInvoiceNumber(userId?: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const dateKey = `${day}${month}${year}`;

  // Use user UUID if provided, otherwise generate new UUID
  const uuid = userId || generateUUID();
  const firstSection = uuid.split('-')[0].toUpperCase();

  // Generate cryptographically secure random 3-digit counter
  const counter = getSecureRandomNumber(1, 999);
  const counterStr = String(counter).padStart(3, "0");
  return `INV-${dateKey}-${firstSection}-${counterStr}`;
}

// Generate cryptographically secure random number in range [min, max]
function getSecureRandomNumber(min: number, max: number): number {
  // Use crypto.getRandomValues for secure random generation
  const range = max - min + 1;
  const randomBuffer = new Uint32Array(1);

  // Generate random number and scale to desired range
  crypto.getRandomValues(randomBuffer);
  return min + (randomBuffer[0] % range);
}

// Format date as DDMMYY for filename
export function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

// Sanitize filename (remove special characters and path traversal)
export function sanitizeFilename(name: string): string {
  // Remove path traversal and dangerous characters
  let sanitized = name
    .replace(/[/\\?%*:|"<>]/g, '') // Remove path traversal and illegal filename chars
    .replace(/\.\./g, '') // Remove double dots
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // Ensure not empty and limit length
  sanitized = sanitized.substring(0, 50) || 'file';

  return sanitized;
}

// Image upload validation
export interface ImageValidationOptions {
  maxSizeBytes?: number; // Default 5MB
  allowedTypes?: string[]; // Default ['image/jpeg', 'image/png', 'image/webp']
  maxDimensions?: { width: number; height: number }; // Default 2000x2000
  minDimensions?: { width: number; height: number }; // Default 10x10
}

// Comprehensive image validation
export async function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): Promise<{ valid: boolean; error?: string }> {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions = { width: 2000, height: 2000 },
    minDimensions = { width: 10, height: 10 }
  } = options;

  // 1. Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.floor(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // 2. Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // 3. Verify file signature (magic bytes)
  const fileSignature = await getFileSignature(file);
  const validSignatures: Record<string, string[]> = {
    'image/jpeg': ['FFD8FF'], // JPEG
    'image/png': ['89504E47'], // PNG
    'image/webp': ['52494646'], // WEBP (RIFF...WEBP)
  };

  const expectedSignatures = validSignatures[file.type];
  if (!expectedSignatures.some(sig => fileSignature.startsWith(sig))) {
    return { valid: false, error: 'Invalid file signature. File may be corrupted or malicious.' };
  }

  // 4. Check image dimensions
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < minDimensions.width || dimensions.height < minDimensions.height) {
      return {
        valid: false,
        error: `Image dimensions too small. Minimum: ${minDimensions.width}x${minDimensions.height}px`
      };
    }
    if (dimensions.width > maxDimensions.width || dimensions.height > maxDimensions.height) {
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${maxDimensions.width}x${maxDimensions.height}px`
      };
    }
  } catch {
    return { valid: false, error: 'Failed to read image. File may be corrupted.' };
  }

  return { valid: true };
}

// Get file signature (magic bytes)
async function getFileSignature(file: File): Promise<string> {
  const arrayBuffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// Get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Compress image for mobile upload (preserves PNG transparency)
export function compressImage(
  file: File,
  maxSizeKB: number = 100,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Detect if image is PNG (for transparency support)
    const isPNG = file.type === "image/png";

    img.onload = () => {
      // Calculate new dimensions
      const maxWidth = 300;
      const maxHeight = 300;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Clear canvas with transparency for PNG
      if (ctx) {
        if (isPNG) {
          ctx.clearRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Use PNG for transparency, JPEG for photos
      if (isPNG) {
        // PNG: Try to compress while maintaining transparency
        let dataUrl = canvas.toDataURL("image/png");

        // If too large, reduce dimensions further
        if (dataUrl.length > maxSizeKB * 1024 * 1.37) {
          const scale = Math.sqrt((maxSizeKB * 1024 * 1.37) / dataUrl.length);
          const newWidth = Math.floor(width * scale);
          const newHeight = Math.floor(height * scale);

          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx?.clearRect(0, 0, newWidth, newHeight);
          ctx?.drawImage(img, 0, 0, newWidth, newHeight);
          dataUrl = canvas.toDataURL("image/png");
        }

        resolve(dataUrl);
      } else {
        // JPEG: Compress with quality adjustment
        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      }
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Detect if user is on mobile
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

// Detect thumb zone position
export function getThumbZone(y: number): "green" | "yellow" | "red" {
  const vh = window.innerHeight;
  if (y > vh * 0.6) return "green";
  if (y > vh * 0.3) return "yellow";
  return "red";
}
