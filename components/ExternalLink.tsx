import React from 'react';
import ArrowRightIcon from './icons/arrow-right-icon';

export default function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer text-secondary-500 flex items-center gap-[4px]"
    >
      {children}
      <ArrowRightIcon weight="3" className="stroke-secondary-500 -rotate-45" />
    </a>
  );
}
