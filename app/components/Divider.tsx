import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
}

const Divider = ({ className }: DividerProps) => {
  return <div className={cn('border-t border-base-400 dark:border-accent-50', className)} />;
};

export default Divider;
