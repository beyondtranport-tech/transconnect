import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || typeof amount !== 'number' || isNaN(amount)) {
    return 'R 0.00';
  }
  const parts = amount.toFixed(2).toString().split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R ${integerPart}.${parts[1]}`;
}

export function formatDateSafe(dateValue: any, formatString: string = "dd MMM yyyy"): string {
    if (!dateValue) return 'N/A';
    let date;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
    } else {
        date = new Date(dateValue);
    }
    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, formatString);
}

export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return '0';
    }
    const fixedValue = value.toFixed(0);
    return fixedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Safely copies HTML content to the clipboard with robust feature detection.
 * Avoids "Illegal constructor" errors in restricted browser environments.
 */
export async function copyHtmlToClipboard(html: string, plainText?: string) {
    if (typeof window === 'undefined') return false;

    const textToCopy = plainText || html.replace(/<[^>]*>/g, '');

    try {
        // Step 1: Attempt rich-text copy using modern API if supported and safe
        if (typeof window.ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
            try {
                const htmlBlob = new Blob([html], { type: 'text/html' });
                const textBlob = new Blob([textToCopy], { type: 'text/plain' });
                
                // Constructing the items object directly to avoid constructor issues in some environments
                const items = {
                    'text/html': htmlBlob,
                    'text/plain': textBlob,
                };
                
                // Only use the constructor if it's explicitly available and non-restricted
                const clipboardItem = new window.ClipboardItem(items);
                await navigator.clipboard.write([clipboardItem]);
                return true;
            } catch (innerError) {
                console.warn("ClipboardItem construction failed, falling back to writeText:", innerError);
            }
        }
    } catch (e) {
        console.warn("Advanced clipboard copy failed:", e);
    }

    // Step 2: Reliable fallback to standard plain-text copying
    try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
    } catch (e) {
        console.error("Clipboard copy failed entirely:", e);
        return false;
    }
}
