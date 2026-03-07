import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid date';
  return format(parsedDate, 'MMM dd, yyyy');
}

export function formatRelativeDate(date: string): string {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Unknown time';
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

export const categoryColors: Record<string, string> = {
  Technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Tutorial: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Career: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Lifestyle: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'AI & ML': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};
