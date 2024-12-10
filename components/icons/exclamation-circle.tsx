import React from 'react';

export default function ExclamationCircleIcon({
  height,
  width,
  weight,
  className,
}: {
  height?: number;
  width?: number;
  weight: string;
  className?: string;
}) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className || ''}`}
    >
      <circle cx="12" cy="12" r="10" stroke="inherit" stroke-width="1.5" />
      <path d="M12 7V13" stroke="inherit" stroke-width="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="inherit" />
    </svg>
  );
}
