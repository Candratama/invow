import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : parseLocalDate(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
}

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateInvoiceNumber(date?: Date, userId?: string, sequenceNumber: number = 1): string {
  const invoiceDate = date || new Date();
  const day = String(invoiceDate.getDate()).padStart(2, '0');
  const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
  const year = String(invoiceDate.getFullYear()).slice(-2); // Last 2 digits of year
  
  // Get first 8 characters of user ID (uppercase)
  const userCode = userId ? userId.substring(0, 8).toUpperCase() : 'XXXXXXXX';
  
  // Format sequence number as 3 digits, cap at 999 (max 999 invoices per day)
  const cappedSequence = Math.min(sequenceNumber, 999);
  const sequence = String(cappedSequence).padStart(3, '0');
  
  return `INV-${day}${month}${year}-${userCode}-${sequence}`;
}

export function parseLocalDate(dateString: string): Date {
  // Parse date string in YYYY-MM-DD format as local date (not UTC)
  // This prevents timezone conversion issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateForInput(date: Date): string {
  // Format date as YYYY-MM-DD for input[type="date"]
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace characters that are invalid in filenames
  // This prevents path traversal attacks and special character issues
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 200); // Limit length to prevent issues
}

export interface ImageValidationOptions {
  maxSizeKB?: number;
  allowedTypes?: string[];
}

export async function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): Promise<{ valid: boolean; error?: string }> {
  const { maxSizeKB = 5000, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' };
  }
  
  // Check file size
  const fileSizeKB = file.size / 1024;
  if (fileSizeKB > maxSizeKB) {
    return { valid: false, error: `File size must be less than ${maxSizeKB}KB` };
  }
  
  return { valid: true };
}

export async function compressImage(
  file: File, 
  maxSizeKB: number = 500,
  preserveTransparency: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // For JPEG output, fill with white background first (prevents black background)
        if (!preserveTransparency) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use PNG for transparency, JPEG otherwise
        const outputFormat = preserveTransparency ? 'image/png' : 'image/jpeg';
        
        // Try different quality levels to meet size requirement
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              const sizeKB = blob.size / 1024;
              
              if (sizeKB <= maxSizeKB || quality <= 0.3) {
                // Convert blob to base64
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve(reader.result as string);
                };
                reader.readAsDataURL(blob);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            outputFormat,
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
