import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
}

const Divider = ({ className }: DividerProps) => {
  return <div className={cn('border-t border-stroke', className)} />;
};

export default Divider;
