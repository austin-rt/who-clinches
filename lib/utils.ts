import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines clsx and tailwind-merge for conditional class names with conflict resolution.
 * 
 * @example
 * cn('p-4', 'p-6') // → 'p-6' (conflict resolved)
 * cn('badge', isActive && 'badge-primary') // → conditional classes
 * cn('p-4', 'md:p-6') // → 'p-4 md:p-6' (modifiers preserved)
 */
export const cn = (...inputs: Parameters<typeof clsx>) => {
  return twMerge(clsx(inputs));
};

