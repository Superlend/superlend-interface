import React from 'react';

export default function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || ''}
    >
      <g clipPath="url(#clip0_2435_25049)">
        <circle cx="7.66683" cy="7.66671" r="6.33333" stroke="#6D6C6B" strokeWidth="1.5" />
        <path
          d="M12.3335 12.3334L14.6668 14.6667"
          stroke="#6D6C6B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2435_25049">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
