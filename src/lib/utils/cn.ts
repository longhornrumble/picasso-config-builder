/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class names, handling Tailwind conflicts intelligently
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', isActive && 'text-green-500') // => 'text-green-500' (if isActive)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
