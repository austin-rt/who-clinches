import { type ComponentPropsWithRef } from 'react';

export interface BaseInputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
}
