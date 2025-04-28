'use client'

import { useAssetsDataContext } from '@/context/data-provider'
import { abbreviateNumber, cn } from '../lib/utils'
import React, { useEffect, useState } from 'react'
import InfoTooltip from './tooltips/InfoTooltip'
import ImageWithDefault from './ImageWithDefault'
import { BodyText, Label } from './ui/typography'
import { Skeleton } from './ui/skeleton'

export const InfiniteMovingTokenBadges = ({
    opportunitiesData,
    isLoadingOpportunitiesData,
    direction = 'left',
    speed = 'fast',
    pauseOnHover = true,
    className,
}: {
    opportunitiesData: any[]
    isLoadingOpportunitiesData: boolean
    direction?: 'left' | 'right'
    speed?: 'fast' | 'normal' | 'slow'
    pauseOnHover?: boolean
    className?: string
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const scrollerRef = React.useRef<HTMLUListElement>(null)
    const { allChainsData } = useAssetsDataContext()

    useEffect(() => {
        addAnimation()
    }, [])
    const [start, setStart] = useState(false)
    function addAnimation() {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children)

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true)
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(duplicatedItem)
                }
            })

            getDirection()
            getSpeed()
            setStart(true)
        }
    }
    const getDirection = () => {
        if (containerRef.current) {
            if (direction === 'left') {
                containerRef.current.style.setProperty(
                    '--animation-direction',
                    'forwards'
                )
            } else {
                containerRef.current.style.setProperty(
                    '--animation-direction',
                    'reverse'
                )
            }
        }
    }
    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === 'fast') {
                containerRef.current.style.setProperty(
                    '--animation-duration',
                    '20s'
                )
            } else if (speed === 'normal') {
                containerRef.current.style.setProperty(
                    '--animation-duration',
                    '40s'
                )
            } else {
                containerRef.current.style.setProperty(
                    '--animation-duration',
                    '80s'
                )
            }
        }
    }
    return (
        <div
            ref={containerRef}
            className={cn(
                'scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    ' flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap',
                    start && 'animate-scroll ',
                    pauseOnHover && 'hover:[animation-play-state:paused]'
                )}
            >
                {isLoadingOpportunitiesData &&
                    Array.from({ length: 10 }).map((_, index) => (
                        <li key={`opportunity-${index}`} className="w-auto">
                            <Skeleton className="h-[32px] w-[100px] rounded-4" />
                        </li>
                    ))}
                {!isLoadingOpportunitiesData &&
                    opportunitiesData.map((opportunity: any, index: number) => (
                        <li key={`opportunity-${index}`} className="w-auto">
                            <InfoTooltip
                                side="left"
                                label={
                                    <div className="flex gap-2 items-center py-1 pr-2 pl-1 bg-white rounded-4 shadow-sm hover:shadow-none border border-transaprent hover:border-secondary-300 transition-all duration-300">
                                        <ImageWithDefault
                                            loading="lazy"
                                            src={opportunity.token.logo}
                                            alt={opportunity.token.name}
                                            width={26}
                                            height={26}
                                            className="object-contain shrink-0 rounded-full h-[26px] w-[26px] max-w-[26px] max-h-[26px] select-none"
                                        />
                                        <BodyText
                                            level="body2"
                                            weight="medium"
                                            className="select-none"
                                        >
                                            {abbreviateNumber(
                                                Number(
                                                    opportunity.platform.apy
                                                        .avg_7days
                                                )
                                            )}
                                            %
                                        </BodyText>
                                    </div>
                                }
                                content={
                                    <div className="flex flex-col select-none divide-y divide-gray-200">
                                        <div className="flex gap-2 items-center justify-start pb-2">
                                            <ImageWithDefault
                                                loading="lazy"
                                                src={
                                                    '/icons/graph-up-in-box.svg'
                                                }
                                                alt={'Last 7D APY'}
                                                width={16}
                                                height={16}
                                                className="object-contain shrink-0 h-[16px] w-[16px] max-w-[16px] max-h-[16px]"
                                            />
                                            <Label
                                                weight="normal"
                                                className="text-gray-700"
                                            >
                                                Last 7D APY
                                            </Label>
                                        </div>
                                        <div className="flex gap-2 items-center justify-start py-1">
                                            <ImageWithDefault
                                                loading="lazy"
                                                src={opportunity.platform.logo}
                                                alt={opportunity.platform.name}
                                                width={14}
                                                height={14}
                                                className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                            />
                                            <Label
                                                weight="normal"
                                                className="text-gray-700"
                                            >
                                                {opportunity.platform.name}
                                            </Label>
                                        </div>
                                        <div className="flex gap-2 items-center justify-start pt-2">
                                            <ImageWithDefault
                                                loading="lazy"
                                                src={
                                                    allChainsData.find(
                                                        (chain) =>
                                                            chain.chain_id ===
                                                            opportunity.chain_id
                                                    )?.logo || ''
                                                }
                                                alt={
                                                    allChainsData.find(
                                                        (chain) =>
                                                            chain.chain_id ===
                                                            opportunity.chain_id
                                                    )?.name || ''
                                                }
                                                width={14}
                                                height={14}
                                                className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                            />
                                            <Label
                                                weight="normal"
                                                className="text-gray-700"
                                            >
                                                {
                                                    allChainsData.find(
                                                        (chain) =>
                                                            chain.chain_id ===
                                                            opportunity.chain_id
                                                    )?.name
                                                }
                                            </Label>
                                        </div>
                                    </div>
                                }
                            />
                        </li>
                    ))}
            </ul>
        </div>
    )
}
