import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type BaseLinkButtonProps } from './BaseLinkButtonProps';

const StrokedLinkButton = ({
  size = 'md',
  color = 'primary',
  children,
  className,
  ...props
}: BaseLinkButtonProps) => {
  const linkClasses = cn(
    'btn',
    'btn-stroke',
    {
      'btn-primary': color === 'primary',
      'btn-secondary': color === 'secondary',
      'btn-accent': color === 'accent',
      'btn-neutral': color === 'neutral',
      'btn-info': color === 'info',
      'btn-success': color === 'success',
      'btn-warning': color === 'warning',
      'btn-error': color === 'error',
      'btn-xs': size === 'xs',
      'btn-sm': size === 'sm',
      'btn-md': size === 'md',
      'btn-lg': size === 'lg',
      'btn-xl': size === 'xl',
    },
    className
  );

  return (
    <Link className={linkClasses} {...props}>
      {children}
    </Link>
  );
};

StrokedLinkButton.displayName = 'StrokedLinkButton';

export default StrokedLinkButton;
