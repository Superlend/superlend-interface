"use client";

import React from "react";

import { cn } from "@/lib/utils";
import ImageWithDefault from "../ImageWithDefault";
import InfoTooltip from "../tooltips/InfoTooltip";
import { Label } from "./typography";

interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: string[];
  avatarDetails?: any[];
}

const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
  avatarDetails,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-3 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <InfoTooltip
          key={index}
          label={
            <ImageWithDefault
              key={index}
              className="h-[24px] w-[24px] max-w-[24px] max-h-[24px] rounded-full border-2 border-white dark:border-gray-800 md:hover:scale-150 transition-transform ease-in delay-150 bg-white"
              src={url}
              width={24}
              height={24}
              alt={`Avatar ${index + 1}`}
            />
          }

          content={
            avatarDetails && <Label weight="semibold" size="medium" className="">{`$${avatarDetails[index].amount}`}</Label>
          }
        />
      ))}
      {numPeople && numPeople > 3 &&
        <span
          className="flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white hover:bg-gray-600 dark:border-gray-800 dark:bg-white dark:text-black"
        >
          +{numPeople}
        </span>}
    </div>
  );
};

export default AvatarCircles;
