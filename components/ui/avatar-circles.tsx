'use client'

import React from 'react'

import {
    cn,
    getLowestDisplayValue,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import ImageWithDefault from '../ImageWithDefault'
import InfoTooltip from '../tooltips/InfoTooltip'
import { BodyText, Label } from './typography'

interface AvatarCirclesProps {
    className?: string
    moreItemsCount?: number
    avatarUrls: string[]
    avatarDetails?: any[]
    maxItemsToShow?: number
    showMoreItemsTooltip?: boolean
    moreItemsTooltipContent?: string | React.ReactNode
}

const AvatarCircles = ({
    className,
    avatarUrls,
    avatarDetails,
    maxItemsToShow = 3,
    showMoreItemsTooltip = false,
    moreItemsTooltipContent
}: AvatarCirclesProps) => {
    const avatarUrlsToShow = avatarUrls.slice(0, maxItemsToShow);
    const moreItemsCount = avatarUrls.length - maxItemsToShow;

    return (
        <div
            className={cn(
                'flex -space-x-3 rtl:space-x-reverse',
                className
            )}
        >
            {avatarDetails &&
                avatarUrlsToShow.map((url, index) => (
                    <InfoTooltip
                        key={index}
                        label={
                            <ImageWithDefault
                                key={index}
                                className="h-[24px] w-[24px] max-w-[24px] max-h-[24px] rounded-full border-2 border-white dark:border-gray-800 delay-75 md:hover:scale-150 transition-transform ease-in delay-150 bg-white"
                                src={url || ''}
                                width={24}
                                height={24}
                                alt={`Avatar ${index + 1}`}
                            />
                        }
                        content={
                            avatarDetails && (
                                <>
                                    {avatarDetails[index].title && (
                                        <Label
                                            weight="medium"
                                            size="small"
                                            className="text-gray-700"
                                        >
                                            {avatarDetails[index].title}
                                        </Label>
                                    )}
                                    <BodyText level="body2" weight="medium">
                                        {avatarDetails[index].content}
                                    </BodyText>
                                </>
                            )
                        }
                    />
                ))}
            {!avatarDetails &&
                avatarUrlsToShow.map((url, index) => (
                    <ImageWithDefault
                        key={index}
                        className="h-[24px] w-[24px] max-w-[24px] max-h-[24px] rounded-full border-2 border-white dark:border-gray-800 delay-75 transition-transform ease-in delay-150 bg-white"
                        src={url || ''}
                        width={24}
                        height={24}
                        alt={`Avatar ${index + 1}`}
                    />
                ))}
            {/* Show more items count */}
            {moreItemsCount > 0 && !showMoreItemsTooltip && (
                <span className="select-none flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-secondary-300/75 bg-white text-center text-xs font-medium text-secondary-500 hover:bg-gray-400 dark:border-gray-800 dark:bg-white dark:text-black">
                    +{moreItemsCount}
                </span>
            )}
            {/* Show more items tooltip */}
            {(moreItemsCount > 0 && showMoreItemsTooltip) && (
                <InfoTooltip
                    label={
                        <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-secondary-300/75 bg-white text-center text-xs font-medium text-secondary-500 hover:bg-gray-400 dark:border-gray-800 dark:bg-white dark:text-black">
                            +{moreItemsCount}
                        </span>
                    }
                    content={
                        (typeof moreItemsTooltipContent === 'string' ||
                            !moreItemsTooltipContent) ? (
                            <BodyText level="body2" weight="medium">
                                {moreItemsCount} more items
                            </BodyText>
                        ) : (
                            moreItemsTooltipContent
                        )
                    }
                />
            )}
        </div>
    )
}

export default AvatarCircles
