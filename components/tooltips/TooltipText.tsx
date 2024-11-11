import { cn } from "@/lib/utils";

export default function TooltipText({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("inline-block border-b border-dashed border-gray-800", className)}>
            {children}
        </span>
    )
}