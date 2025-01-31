import { LoaderCircle } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { cn } from '@/lib/utils'

export default function LoadingSectionSkeleton({
    className,
}: {
    className?: string
}) {
    return (
        <div className={cn('relative rounded-6 overflow-hidden', className)}>
            <Skeleton className="w-full h-full" />
        </div>
    )
}
