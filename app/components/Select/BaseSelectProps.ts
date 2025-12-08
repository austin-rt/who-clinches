import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

export interface BaseSelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  disabled?: boolean;
  children?: ReactNode;
}

