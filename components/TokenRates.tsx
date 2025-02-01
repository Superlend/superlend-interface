'use client'

import React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { TOpportunityTable, TPositionType } from '@/types'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import ImageWithDefault from './ImageWithDefault'
import { abbreviateNumber, cn } from '@/lib/utils'
import InfoTooltip from './tooltips/InfoTooltip'
import { BodyText, Label } from './ui/typography'
import { useAssetsDataContext } from '@/context/data-provider'
import { Skeleton } from './ui/skeleton'
import { InfiniteMovingTokenBadges } from './infinite-moving-token-badges'
import Link from 'next/link'

const TokenRates: React.FC<{
    positionType: TPositionType
}> = ({
    positionType,
}) => {
        const { allChainsData } = useAssetsDataContext()
        const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
            useGetOpportunitiesData({
                type: positionType as TPositionType,
                chain_ids: [],
                tokens: [],
                limit: 10,
            })

        return (
            <div
                className="scroller overflow-hidden flex items-center justify-center max-w-full lg:max-w-2xl h-32 -my-3 [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]"
            >
                <Carousel
                    // opts={{
                    //     align: 'center',
                    //     loop: true,
                    //     dragFree: true,
                    // }}
                    // plugins={[
                    //     Autoplay({
                    //         delay: 1000,
                    //     }),
                    // ]}
                >
                    <CarouselContent
                        className={cn(
                            'animate-scroll ',
                            'hover:[animation-play-state:paused]'
                        )}
                    >

                        {isLoadingOpportunitiesData &&
                            Array.from({ length: 10 }).map((_, index) => (
                                <CarouselItem key={index} className="basis-auto">
                                    <Skeleton className="h-8 w-[100px] rounded-4" />
                                </CarouselItem>
                            ))}
                        {!isLoadingOpportunitiesData &&
                            opportunitiesData.map((opportunity, index) => (
                                <CarouselItem key={index} className="basis-auto">
                                    <InfoTooltip
                                        side="left"
                                        label={
                                            <Link href={getOpportunityUrl({
                                                tokenAddress: opportunity.token.address,
                                                protocol_identifier: opportunity.platform.protocol_identifier,
                                                chain_id: opportunity.chain_id.toString(),
                                                positionType: positionType,
                                            })}>
                                                <div className="flex gap-2 items-center py-1 pr-2 pl-1 bg-white rounded-4 shadow-sm hover:shadow-none border border-transaprent hover:border-secondary-300 transition-all duration-300">
                                                    <ImageWithDefault
                                                        loading="lazy"
                                                        src={opportunity.token.logo}
                                                        alt={opportunity.token.name}
                                                        width={26}
                                                        height={26}
                                                        className="object-contain shrink-0 rounded-full h-[26px] w-[26px] max-w-[26px] max-h-[26px] select-none"
                                                    />
                                                    <BodyText level="body2" weight="medium" className='select-none'>
                                                        {abbreviateNumber(Number(opportunity.platform.apy.avg_7days))}%
                                                    </BodyText>
                                                </div>
                                            </Link>
                                        }
                                        content={
                                            <div className='flex flex-col select-none divide-y divide-gray-200'>
                                                <div className="flex gap-2 items-center justify-start pb-2">
                                                    <ImageWithDefault
                                                        loading="lazy"
                                                        src={'/icons/graph-up-in-box.svg'}
                                                        alt={'Last 7D APY'}
                                                        width={16}
                                                        height={16}
                                                        className="object-contain shrink-0 h-[16px] w-[16px] max-w-[16px] max-h-[16px]"
                                                    />
                                                    <Label weight="normal" className='text-gray-700'>
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
                                                    <Label weight="normal" className='text-gray-700 truncate max-w-[150px]'>
                                                        {opportunity.platform.name}
                                                    </Label>
                                                </div>
                                                <div className="flex gap-2 items-center justify-start pt-2">
                                                    <ImageWithDefault
                                                        loading="lazy"
                                                        src={allChainsData.find((chain) => chain.chain_id === opportunity.chain_id)?.logo}
                                                        alt={allChainsData.find((chain) => chain.chain_id === opportunity.chain_id)?.name}
                                                        width={14}
                                                        height={14}
                                                        className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                                    />
                                                    <Label weight="normal" className='text-gray-700 truncate max-w-[150px]'>
                                                        {allChainsData.find((chain) => chain.chain_id === opportunity.chain_id)?.name}
                                                    </Label>
                                                </div>
                                            </div>
                                        }
                                    />
                                </CarouselItem>
                            ))
                        }
                    </CarouselContent>
                </Carousel>
            </div>
        )
    }

function getOpportunityUrl({
    tokenAddress,
    protocol_identifier,
    chain_id,
    positionType,
}: {
    tokenAddress: string
    protocol_identifier: string
    chain_id: string
    positionType: TPositionType
}) {
    return `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionType}`
}

export default TokenRates
