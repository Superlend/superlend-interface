import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'group inline-flex items-center justify-center whitespace-nowrap rounded-3 font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-transform duration-150 [&.selected]:border-1 [&.selected]:border-secondary-500 [&.selected]:ring-2 md:[&.selected]:ring-1 [&.selected]:ring-secondary-100',
    {
        variants: {
            variant: {
                default:
                    'bg-white text-gray-800 border border-gray-300 hover:bg-gray-200 active:opacity-75 disabled:text-gray-800',
                primary:
                    'bg-gradient-to-b from-primary-gradientStart to-primary-gradientEnd text-primary-foreground hover:to-primary-gradientEndHover active:to-primary-gradientEndActive active:text-primary-foreground/75 disabled:text-primary-foreground/75 border-2 border-orange-600',
                destructive:
                    'bg-destructive text-destructive-foreground hover:opacity-75 active:opacity-50',
                outline:
                    'border border-gray-500 text-gray-800 bg-transparent hover:bg-gray-400/25 active:bg-gray-400/25 disabled:border-gray-200',
                secondaryOutline:
                    'border border-secondary-500 text-secondary-500 bg-transparent hover:bg-secondary-100/15 active:bg-secondary-100/15 active:text-secondary-300/75 active:border-secondary-100/75 disabled:border-secondary-100/75',
                secondary:
                    'bg-gray-300 text-gray-800 hover:bg-gray-200 active:opacity-75 disabled:text-gray-800',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-secondary-500 hover:text-secondary-500/75 active:text-secondary-500/50 rounded-none',
            },
            size: {
                sm: 'px-2 py-1 text-[11px]',
                md: 'px-2 py-1 text-[12px]',
                lg: 'px-2.5 md:px-3 py-2 text-[12px] sm:text-[14px]',
                xl: 'px-2.5 md:px-3 py-2 text-[16px] sm:text-[18px]',
                '2xl': 'px-2.5 md:px-3 py-2 text-[20px] sm:text-[22px]',
                '3xl': 'px-2.5 md:px-3 py-2 text-[24px] sm:text-[26px]',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
