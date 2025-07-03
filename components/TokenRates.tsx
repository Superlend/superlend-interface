'use client'

import React, { useState } from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { TChain, TOpportunityTable, TPositionType, TOpportunity } from '@/types'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import ImageWithDefault from './ImageWithDefault'
import { abbreviateNumber, cn } from '@/lib/utils'
import InfoTooltip from './tooltips/InfoTooltip'
import { BodyText, Label } from './ui/typography'
import { useAssetsDataContext } from '@/context/data-provider'
import { Skeleton } from './ui/skeleton'
import { InfiniteMovingTokenBadges } from './infinite-moving-token-badges'
import Link from 'next/link'
import useDimensions from '@/hooks/useDimensions'
import ArrowRightIcon from './icons/arrow-right-icon'
import { PlatformType } from '@/types/platform'
import ImageWithBadge from './ImageWithBadge'
import { motion } from 'framer-motion'
import { useGetLoopPairsFromAPI } from '@/hooks/useGetLoopPairsFromAPI'
import { TLoopPair } from '@/utils/createLoopPairs'
import DoubleImage from '@/components/DoubleImage'

export default function TokenRates({ positionType }: { positionType: TPositionType }) {
    const { allChainsData } = useAssetsDataContext()
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
        useGetOpportunitiesData({
            type: positionType as TPositionType,
            chain_ids: [],
            tokens: [],
        })
    const { pairs: loopPairs, isLoading: isLoadingLoopPairs } = useGetLoopPairsFromAPI()
    const [isHovering, setIsHovering] = useState(false)

    function handleExcludeMorphoMarketsForLendAssets(opportunity: any) {
        if (!opportunity || !opportunity.platform) {
            return false
        }
        
        const isVault = opportunity.platform.isVault || false
        const isMorpho =
            opportunity.platform.protocol_type === PlatformType.MORPHO

        return !(isMorpho && !isVault)
    }

    function handleExcludeMorphoVaultsForBorrowAssets(opportunity: any) {
        if (!opportunity || !opportunity.platform) {
            return false
        }
        
        const isVault = opportunity.platform.isVault || false
        const isMorpho =
            opportunity.platform.protocol_type === PlatformType.MORPHO

        return !(isMorpho && isVault)
    }

    function handleExcludeMorphoMarketsForLoopAssets(opportunity: TLoopPair) {
        // console.log('Filtering loop strategy:', {
        //     token: (opportunity as any).tokenSymbol || (opportunity as any).tokenName,
        //     platform: (opportunity as any).platformName,
        //     isVault: (opportunity as any).isVault,
        //     platformId: (opportunity as any).platformId,
        // });

        if (!opportunity) {
            return false;
        }

        const isVault = (opportunity as any).isVault || false;
        const platformId = (opportunity as any).platformId;
        const isMorpho = platformId?.split('-')[0]?.toLowerCase() === PlatformType.MORPHO;
        
        const isIncluded = !(isMorpho && !isVault);
        // console.log('Is included:', isIncluded);
        return isIncluded;
    }

    function handleFilterTableRows(opportunity: any) {
        const apy =
            positionType === 'loop'
                ? (opportunity as TLoopPair)?.apy_current
                : (opportunity as TOpportunity)?.platform?.apy?.current
        const isValidApy =
            apy !== null && apy !== undefined && !isNaN(Number(apy)) && Number(apy) > 0

        if (!isValidApy) {
            return false
        }

        if (positionType === 'loop') {
            return handleExcludeMorphoMarketsForLoopAssets(opportunity as TLoopPair)
        }
        return positionType === 'borrow'
            ? handleExcludeMorphoVaultsForBorrowAssets(opportunity)
            : handleExcludeMorphoMarketsForLendAssets(opportunity)
    }

    const isLoading =
        positionType === 'loop'
            ? isLoadingLoopPairs
            : isLoadingOpportunitiesData
    const data: Array<TOpportunity | TLoopPair> =
        positionType === 'loop' ? loopPairs : opportunitiesData

    const filteredOpportunitiesData = data
        .filter(handleFilterTableRows)
        .slice(0, 31)

    return (
        <div
            className={cn(
                'scroller overflow-hidden flex items-center justify-center max-w-full lg:max-w-2xl h-36 -my-5',
                '[mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]'
            )}
        >
            <Carousel>
                <CarouselContent
                    className={cn(
                        'animate-scroll [animation-direction:reverse]',
                        'hover:[animation-play-state:paused]'
                    )}
                >
                    {isLoading &&
                        Array.from({ length: 10 }).map((_, index) => (
                            <CarouselItem key={index} className="basis-auto">
                                <Skeleton className="h-8 w-[100px] rounded-4" />
                            </CarouselItem>
                        ))}
                    {!isLoading &&
                        filteredOpportunitiesData.map((opportunity, index) => (
                            <CarouselItem key={index} className="basis-auto">
                                <InfoTooltip
                                    side="left"
                                    className="z-[9999]"
                                    label={
                                        <LinkWrapper
                                            href={getOpportunityUrl({
                                                opportunity,
                                                positionType: positionType,
                                            })}
                                        >
                                            <motion.div
                                                onMouseEnter={() =>
                                                    setIsHovering(true)
                                                }
                                                onMouseLeave={() =>
                                                    setIsHovering(false)
                                                }
                                                className="flex gap-2 items-center py-1 pr-2 pl-1 bg-white rounded-4 shadow-sm hover:shadow-none border border-transaprent hover:border-secondary-300 transition-all duration-300"
                                            >
                                                {positionType === 'loop' ? (
                                                    <DoubleImage
                                                        src1={
                                                            (
                                                                opportunity as TLoopPair
                                                            )?.tokenLogo || ''
                                                        }
                                                        src2={
                                                            (
                                                                opportunity as TLoopPair
                                                            )?.borrowToken
                                                                ?.logo || ''
                                                        }
                                                    />
                                                ) : (
                                                    <ImageWithBadge
                                                        mainImg={
                                                            (
                                                                opportunity as TOpportunity
                                                            )?.token?.logo || ''
                                                        }
                                                        badgeImg={
                                                            getChainLogo({
                                                                chain_id:
                                                                    opportunity.chain_id.toString(),
                                                                allChainsData,
                                                            }) || ''
                                                        }
                                                        mainImgAlt={
                                                            (
                                                                opportunity as TOpportunity
                                                            )?.token?.name || ''
                                                        }
                                                        badgeImgAlt={
                                                            opportunity?.chain_id?.toString() ||
                                                            ''
                                                        }
                                                        mainImgWidth={24}
                                                        badgeImgWidth={10}
                                                        mainImgHeight={24}
                                                        badgeImgHeight={10}
                                                        badgeCustomClass="bottom-[0px] right-[1px]"
                                                    />
                                                )}
                                                <BodyText
                                                    level="body2"
                                                    weight="medium"
                                                    className="select-none"
                                                >
                                                    {abbreviateNumber(
                                                        Number(
                                                            (
                                                                opportunity as TLoopPair
                                                            )?.apy_current ||
                                                                (
                                                                    opportunity as TOpportunity
                                                                )
                                                                    .platform
                                                                    ?.apy
                                                                    ?.current
                                                        )
                                                    )}
                                                    %
                                                </BodyText>
                                            </motion.div>
                                        </LinkWrapper>
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
                                                    {positionType === 'lend'
                                                        ? 'Supply'
                                                        : positionType ===
                                                          'borrow'
                                                        ? 'Borrow'
                                                        : 'Loop'}{' '}
                                                    APY
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 items-center justify-start py-2 md:py-1">
                                                <ImageWithDefault
                                                    loading="lazy"
                                                    src={
                                                        (
                                                            opportunity as TLoopPair
                                                        )?.tokenLogo ||
                                                        (
                                                            opportunity as TOpportunity
                                                        )?.token?.logo
                                                    }
                                                    alt={
                                                        (
                                                            opportunity as TLoopPair
                                                        )?.tokenName ||
                                                        (
                                                            opportunity as TOpportunity
                                                        )?.token?.name
                                                    }
                                                    width={14}
                                                    height={14}
                                                    className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                                />
                                                <Label
                                                    weight="normal"
                                                    className="text-gray-700 truncate max-w-[150px]"
                                                >
                                                    {(
                                                        opportunity as TLoopPair
                                                    )?.tokenName ||
                                                        (
                                                            opportunity as TOpportunity
                                                        )?.token?.name}
                                                    {positionType === 'loop' &&
                                                        ` → ${
                                                            (
                                                                opportunity as TLoopPair
                                                            )?.borrowToken?.name
                                                        }`}
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 items-center justify-start py-2 md:py-1">
                                                <ImageWithDefault
                                                    loading="lazy"
                                                    src={
                                                        (
                                                            opportunity as TLoopPair
                                                        )?.platformLogo ||
                                                        (
                                                            opportunity as TOpportunity
                                                        )?.platform.logo
                                                    }
                                                    alt={
                                                        (
                                                            opportunity as TLoopPair
                                                        )?.platformName ||
                                                        (
                                                            opportunity as TOpportunity
                                                        )?.platform.name
                                                    }
                                                    width={14}
                                                    height={14}
                                                    className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                                />
                                                <Label
                                                    weight="normal"
                                                    className="text-gray-700 truncate max-w-[150px]"
                                                >
                                                    {(
                                                        opportunity as TLoopPair
                                                    )?.platformName ||
                                                        (
                                                            opportunity as TOpportunity
                                                        ).platform.name}
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 items-center justify-start max-md:py-2 md:pt-2">
                                                <ImageWithDefault
                                                    loading="lazy"
                                                    src={getChainLogo({
                                                        chain_id:
                                                            opportunity.chain_id.toString(),
                                                        allChainsData,
                                                    }) || ''}
                                                    alt={getChainName({
                                                        chain_id:
                                                            opportunity.chain_id.toString(),
                                                        allChainsData,
                                                    }) || ''}
                                                    width={14}
                                                    height={14}
                                                    className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                                />

                                                <Label
                                                    weight="normal"
                                                    className="text-gray-700 truncate max-w-[150px]"
                                                >
                                                    {getChainName({
                                                        chain_id:
                                                            opportunity.chain_id.toString(),
                                                        allChainsData,
                                                    })}
                                                </Label>
                                            </div>
                                            <div className="flex md:hidden gap-2 items-center justify-start pt-2">
                                                <Link
                                                    href={getOpportunityUrl({
                                                        opportunity,
                                                        positionType:
                                                            positionType,
                                                    })}
                                                    className="flex items-center border-b border-secondary-500 gap-1 text-xs text-secondary-500"
                                                >
                                                    <ArrowRightIcon
                                                        weight="2"
                                                        className="stroke-secondary-500 -rotate-45"
                                                    />
                                                    Know more
                                                </Link>
                                            </div>
                                        </div>
                                    }
                                />
                            </CarouselItem>
                        ))}
                </CarouselContent>
            </Carousel>
        </div>
    )
}

function getOpportunityUrl({
    opportunity,
    positionType,
}: {
    opportunity: TLoopPair | TOpportunity
    positionType: TPositionType
}) {
    if (positionType === 'loop') {
        const { tokenAddress, borrowToken, protocol_identifier, chain_id } =
            opportunity as TLoopPair
        return `/position-management?lend_token=${tokenAddress}&borrow_token=${borrowToken.address}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=loop`
    }
    const {
        token: { address: tokenAddress },
        platform: { protocol_identifier },
        chain_id,
    } = opportunity as TOpportunity
    return `/position-management?token=${tokenAddress}&protocol_identifier=${protocol_identifier}&chain_id=${chain_id}&position_type=${positionType}`
}

const LinkWrapper = ({
    children,
    ...props
}: { children: React.ReactNode } & React.ComponentProps<typeof Link>) => {
    const { width } = useDimensions()

    if (width < 768) {
        return <>{children}</>
    }

    return <Link {...props}>{children}</Link>
}

function getChainLogo({
    chain_id,
    allChainsData,
}: {
    chain_id: string
    allChainsData: TChain[]
}) {
    return allChainsData.find((chain) => chain.chain_id === Number(chain_id))
        ?.logo
}

function getChainName({
    chain_id,
    allChainsData,
}: {
    chain_id: string
    allChainsData: TChain[]
}) {
    return allChainsData.find((chain) => chain.chain_id === Number(chain_id))
        ?.name
}
