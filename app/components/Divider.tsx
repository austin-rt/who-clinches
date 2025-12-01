import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
}

const Divider = ({ className }: DividerProps) => {
  return <div className={cn('border-t border-base-300 dark:border-base-400', className)} />;
};

export default Divider;
