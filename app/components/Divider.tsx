import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
}

const Divider = ({ className }: DividerProps) => {
  return <div className={cn('dark:border-accent-50 border-t border-base-400', className)} />;
};

export default Divider;
