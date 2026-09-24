import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date, locale = 'en-US'): string {
  const d = new Date(input);
  return d.toLocaleDateString(locale);
}

export function formatDateTime(input: string | number | Date, locale = 'en-US'): string {
  const d = new Date(input);
  return d.toLocaleString(locale);
}

export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}${path}`;
}