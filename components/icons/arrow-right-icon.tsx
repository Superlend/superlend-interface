import React from 'react';

export default function ArrowRightIcon({ height, width, className, weight }: { height?: number, width?: number, className?: string, weight?: string }) {
    return (
        <svg width={width || "14"} height={height || "14"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className || ""}`}>
            <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="inherit" stroke-width={weight || "1.5"} stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    )
}

