import React from 'react';

export default function ArrowLeftIcon({ height, width, className }: { height?: number, width?: number, className?: string }) {
    return (
        <svg width={width || "14"} height={height || "14"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className || ""}`}>
            <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="inherit" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    )
}
