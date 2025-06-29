import { cn } from '@/lib/utils'

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('relative overflow-hidden bg-gray-200/50', className)}
            {...props}
        >
            <div className="absolute inset-0 before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-gray-100/60 before:to-transparent before:skew-x-[-20deg] before:animate-[shimmer_1.3s_infinite]" />
        </div>
    )
}

export { Skeleton }
