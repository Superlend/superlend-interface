"use client";
import React, { useState } from 'react';
import { Button } from './ui/button';

const LendBorrowToggle: React.FC = () => {
  const [isLend, setIsLend] = useState(true);

  const toggleIsLend = (isLend: boolean) => {
    return () => setIsLend(isLend);
  };

  const BUTTON_DEFAULT_STYLE = "gap-1 self-stretch px-4 py-2 my-auto min-[1100px]:min-w-[120px] md:max-w-[166px] hover:bg-white/45";
  const BUTTON_ACTIVE_STYLE = "shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)] rounded-3";

  return (
    <div className="flex gap-1 items-center p-[4px] font-semibold tracking-normal leading-tight uppercase whitespace-nowrap rounded-4 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)] max-w-fit">
      <Button variant={isLend ? "primary" : "ghost"} size="sm" onClick={toggleIsLend(true)} className={`${BUTTON_DEFAULT_STYLE} ${isLend ? BUTTON_ACTIVE_STYLE : ''}`}>
        Lend
      </Button>
      <Button variant={isLend ? "ghost" : "primary"} size="sm" onClick={toggleIsLend(false)} className={`${BUTTON_DEFAULT_STYLE} ${isLend ? '' : BUTTON_ACTIVE_STYLE}`}>
        Borrow
      </Button>
    </div>
  );
};

export default LendBorrowToggle;