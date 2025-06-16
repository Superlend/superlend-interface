import React from 'react'

type TListItem = {
    id: string | number
    src: string
    alt: string
    width?: string
    height?: string
    className?: string
}

type TProps = {
    list: TListItem[]
}

export default function StackedIcons({ list }: TProps) {
    return (
        <div className="relative group flex items-center">
            {list.map((item) => (
                <img
                    key={item.id}
                    src={item.src}
                    alt={item.alt || ''}
                    width={item.width || 20}
                    height={item.height || 20}
                    className={`first:ml-0 -ml-3 p-[1.5px] bg-white rounded-full group-hover:-ml-1 transition-all duration-300 ${item.className || ''}`}
                />
            ))}
        </div>
    )
}
