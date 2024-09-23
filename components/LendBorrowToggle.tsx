"use client";
import React, { useState } from 'react';
import { Button } from './ui/button';
import { TOpportunityType } from '@/types';

type TProps = {
  type: TOpportunityType;
  handleToggle: (opportunityType: TOpportunityType) => void;
}

const LendBorrowToggle = ({ type, handleToggle }: TProps) => {
  const opportunityType = {
    lend: "lend",
    borrow: "borrow",
  }

  function checkType(typeToMatch: TOpportunityType): boolean {
    return opportunityType[typeToMatch] === type;
  }

  const BUTTON_DEFAULT_STYLE = "gap-1 self-stretch px-4 py-2 my-auto min-[1100px]:min-w-[120px] md:max-w-[166px] hover:bg-white/45";
  const BUTTON_ACTIVE_STYLE = "shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)] rounded-3";

  return (
    <div className="flex gap-1 items-center p-[4px] font-semibold tracking-normal leading-tight uppercase whitespace-nowrap rounded-4 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)] max-w-fit">
      <Button variant={checkType("lend") ? "primary" : "ghost"} size="sm" onClick={() => handleToggle("lend")} className={`${BUTTON_DEFAULT_STYLE} ${checkType("lend") ? BUTTON_ACTIVE_STYLE : ''}`}>
        Lend
      </Button>
      <Button variant={checkType("borrow") ? "primary" : "ghost"} size="sm" onClick={() => handleToggle("borrow")} className={`${BUTTON_DEFAULT_STYLE} ${checkType("borrow") ? BUTTON_ACTIVE_STYLE : ''}`}>
        Borrow
      </Button>
    </div>
  );
};

export default LendBorrowToggle;