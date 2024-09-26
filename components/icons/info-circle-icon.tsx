import React from 'react'

export default function InfoCircleIcon({ height, width, className, weight }: { height?: number, width?: number, className?: string, weight?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7.99967" cy="8.00016" r="6.66667" stroke="#6D6C6B" stroke-width="1.5" />
            <path d="M8 11.3334V7.33337" stroke="#6D6C6B" stroke-width="1.5" stroke-linecap="round" />
            <circle cx="0.666667" cy="0.666667" r="0.666667" transform="matrix(1 0 0 -1 7.33301 6)" fill="#6D6C6B" />
        </svg>

    )
}


