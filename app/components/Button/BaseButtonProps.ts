import { type ComponentPropsWithRef, type ReactNode } from 'react';

export interface BaseButtonProps extends ComponentPropsWithRef<'button'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}
