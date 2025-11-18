'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: string;
}

const LoadingSpinner = ({ className, size }: LoadingSpinnerProps) => {
  return (
    <div className={cn('flex justify-center py-8', className)}>
      <span className={cn('loading loading-bars text-primary', size)}></span>
    </div>
  );
};

export default LoadingSpinner;
