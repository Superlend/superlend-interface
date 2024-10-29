import { LoaderCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function LoadingSectionSkeleton() {
    return (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-6 overflow-hidden">
            <Skeleton className='w-full h-full' />
            <LoaderCircle className='absolute left-[45%] top-[45%] md:left-1/2 text-primary w-8 h-8 animate-spin' />
        </div>
    )
}