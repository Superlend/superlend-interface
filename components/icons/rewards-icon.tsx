import React from 'react'

export default function RewardsIcon({
  height,
  width,
  className,
}: {
  height?: number
  width?: number
  className?: string
}) {
  return (
    <svg
      width={width || '14'}
      height={height || '14'}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`stroke-gray-800 group-[.active]:stroke-primary min-[768px]:group-hover:stroke-primary ${className || ''}`}
    >
      <path
        d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
        stroke="inherit"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
        stroke="inherit"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
} 