import React from 'react'

export default function SlashIcon({ height, width, className }: { height?: number, width?: number, className?: string }) {
    return (
        <svg width={width || "7"} height={height || "15"} viewBox="0 0 7 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className || ""}`}>
            <path d="M0.242188 14.125V13.9688L4.73438 0.210938H6.44531V0.367188L1.9375 14.125H0.242188Z" fill="inherit" />
        </svg>

    )
}
