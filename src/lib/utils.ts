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
    return value.toLocaleString('en-US'); // Use a fixed locale like en-US to ensure consistency
}
