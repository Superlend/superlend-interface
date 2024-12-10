import React from 'react';

interface IContainer {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className }: IContainer) {
  return (
    <div
      className={`max-w-[1200px] mx-auto pb-[50px] ${className?.includes('px-0') ? '' : 'px-[20px]'} ${className || ''}`}
    >
      {children}
    </div>
  );
}
