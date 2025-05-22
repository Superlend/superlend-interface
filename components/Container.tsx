import React from 'react'

interface IContainer {
    children: React.ReactNode
    className?: string
}

export default function Container({ children, className }: IContainer) {
    return (
        <div
            className={`max-w-[1200px] mx-auto ${className?.includes('px-') ? '' : 'px-[20px]'} ${className?.includes('pb-') ? '' : 'pb-[50px]'} ${className || ''}`}
        >
            {children}
        </div>
    )
}
