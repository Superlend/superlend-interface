import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border py-[4px] text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none leading-none",
  {
    variants: {
      variant: {
        default:
          "border bg-white text-gray-800 hover:bg-gray-200 [&.selected]:border-secondary-500 [&.selected]:ring-2 [&.selected]:ring-secondary-100/50",
        secondary:
          "border-transparent bg-secondary-500 text-secondary-foreground hover:bg-secondary/80 text-white",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive",
        outline: "text-gray-500 bg-transparent",
        link: "border-transparent text-secondary-500",
        green: "border-transparent bg-[#00C939] bg-opacity-15 text-[#00AD31]",
        blue: "border-transparent bg-secondary-100/15 text-secondary-500",
        yellow: "border-transparent bg-[#FFA319]/15 text-[#D19900]",
      },
      size: {
        sm: "px-[4px] rounded-2 uppercase",
        md: "px-[6px] rounded-3",
        lg: "px-[8px] rounded-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
