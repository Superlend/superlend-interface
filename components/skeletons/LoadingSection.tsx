import { LoaderCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function LoadingSectionSkeleton() {
    return (
        <div className="relative w-full h-[300px] md:h-[400px]">
            <Skeleton className='w-full h-full rounded-6' />
            <LoaderCircle className='absolute left-1/2 top-1/2 text-primary w-8 h-8 animate-spin' />
        </div>
    )
}