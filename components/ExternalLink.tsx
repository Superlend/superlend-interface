import React from 'react'
import ArrowRightIcon from './icons/arrow-right-icon'

export default function ExternalLink({
    href,
    children,
    className,
}: {
    href: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-fit shrink-0 inline-flex items-center gap-[2px] text-secondary-500 border-b border-secondary-500 hover:border-secondary-500/40 leading-[0.5] ${className || ""}`}
        >
            {children}
            <ArrowRightIcon
                weight="2"
                className="stroke-secondary-500 -rotate-45"
            />
        </a>
    )
}
