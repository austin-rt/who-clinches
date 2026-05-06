import { type ComponentProps, type ReactNode } from 'react';
import type Link from 'next/link';

export interface BaseLinkButtonProps extends ComponentProps<typeof Link> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  children?: ReactNode;
}
