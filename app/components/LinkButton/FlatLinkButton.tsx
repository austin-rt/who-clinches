import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type BaseLinkButtonProps } from './BaseLinkButtonProps';

interface FlatLinkButtonProps extends BaseLinkButtonProps {
  noPadding?: boolean;
  noHover?: boolean;
}

const FlatLinkButton = ({
  size = 'md',
  color = 'primary',
  noPadding = false,
  noHover = false,
  children,
  className,
  ...props
}: FlatLinkButtonProps) => {
  const linkClasses = cn(
    'btn',
    'btn-flat',
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
      'p-0': noPadding,
      'hover:bg-transparent': noHover,
    },
    className
  );

  return (
    <Link className={linkClasses} {...props}>
      {children}
    </Link>
  );
};

FlatLinkButton.displayName = 'FlatLinkButton';

export default FlatLinkButton;
