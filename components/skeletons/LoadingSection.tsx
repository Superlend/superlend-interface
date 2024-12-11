import { LoaderCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export default function LoadingSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-6 overflow-hidden', className)}>
      <Skeleton className="w-full h-full" />
      <LoaderCircle className="absolute left-[45%] top-[45%] md:left-1/2 text-primary w-8 h-8 animate-spin" />
    </div>
  );
}
