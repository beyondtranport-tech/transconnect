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
 * Avoids "Illegal constructor" errors by using a resilient hidden-element strategy.
 */
export async function copyHtmlToClipboard(html: string, plainText?: string) {
    if (typeof window === 'undefined') return false;

    const textToCopy = plainText || html.replace(/<[^>]*>/g, '');

    // Attempt 1: Safe hidden-element approach to avoid ClipboardItem constructor crash
    try {
        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.position = 'fixed';
        container.style.pointerEvents = 'none';
        container.style.opacity = '0';
        document.body.appendChild(container);

        window.getSelection()?.removeAllRanges();
        const range = document.createRange();
        range.selectNode(container);
        window.getSelection()?.addRange(range);

        const success = document.execCommand('copy');
        document.body.removeChild(container);
        
        if (success) return true;
    } catch (e) {
        console.warn("Fallback HTML copy failed:", e);
    }

    // Attempt 2: Plain text fallback
    try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
    } catch (e) {
        console.error("All copy methods failed:", e);
        return false;
    }
}
