"use client";

import React from "react";

import { cn, getLowestDisplayValue, hasLowestDisplayValuePrefix } from "@/lib/utils";
import ImageWithDefault from "../ImageWithDefault";
import InfoTooltip from "../tooltips/InfoTooltip";
import { BodyText, Label } from "./typography";

interface AvatarCirclesProps {
  className?: string;
  moreItemsCount?: number;
  avatarUrls: string[];
  avatarDetails?: any[];
  maxItemsToShow?: number;
}

const AvatarCircles = ({
  moreItemsCount,
  className,
  avatarUrls,
  avatarDetails,
  maxItemsToShow = 3,
}: AvatarCirclesProps) => {
  const avatarUrlsToShow = moreItemsCount ? avatarUrls.slice(0, maxItemsToShow) : avatarUrls;

  return (
    <div className={cn("z-10 flex -space-x-3 rtl:space-x-reverse", className)}>
      {avatarUrlsToShow.map((url, index) => (
        <InfoTooltip
          key={index}
          label={
            <ImageWithDefault
              key={index}
              className="h-[24px] w-[24px] max-w-[24px] max-h-[24px] rounded-full border-2 border-white dark:border-gray-800 delay-75 md:hover:scale-150 transition-transform ease-in delay-150 bg-white"
              src={url}
              width={24}
              height={24}
              alt={`Avatar ${index + 1}`}
            />
          }

          content={
            avatarDetails && (
              <>
                {avatarDetails[index].title &&
                  <Label weight="medium" size="small" className="text-gray-700">{avatarDetails[index].title}</Label>
                }
                <BodyText level="body2" weight="medium">{avatarDetails[index].content}</BodyText>
              </>
            )
          }
        />
      ))}
      {!!moreItemsCount && moreItemsCount > 0 &&
        <span
          className="flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-secondary-300/75 bg-white text-center text-xs font-medium text-secondary-500 hover:bg-gray-400 dark:border-gray-800 dark:bg-white dark:text-black"
        >
          +{moreItemsCount}
        </span>}
    </div>
  );
};

export default AvatarCircles;
