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
import { TChain, TOpportunityTable, TPositionType } from '@/types'
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

const TokenRates: React.FC<{
    positionType: TPositionType
}> = ({ positionType }) => {
    const { allChainsData } = useAssetsDataContext()
    const { data: opportunitiesData, isLoading: isLoadingOpportunitiesData } =
        useGetOpportunitiesData({
            type: positionType as TPositionType,
            chain_ids: [],
            tokens: [],
        })
    const [isHovering, setIsHovering] = useState(false)

    function handleExcludeMorphoMarketsForLendAssets(opportunity: any) {
        const isVault = opportunity.platform.isVault
        const isMorpho =
            opportunity.platform.protocol_type === PlatformType.MORPHO

        return !(isMorpho && !isVault)
    }

    function handleExcludeMorphoVaultsForBorrowAssets(opportunity: any) {
        const isVault = opportunity.platform.isVault
        const isMorpho =
            opportunity.platform.protocol_type === PlatformType.MORPHO

        return !(isMorpho && isVault)
    }

    function handleFilterTableRows(opportunity: any) {
        return positionType === 'borrow'
            ? handleExcludeMorphoVaultsForBorrowAssets(opportunity)
            : handleExcludeMorphoMarketsForLendAssets(opportunity)
    }

    const filteredOpportunitiesData = opportunitiesData
        .filter(handleFilterTableRows)
        .slice(0, 31)

    return (
        <div
            className={cn(
                'scroller overflow-hidden flex items-center justify-center max-w-full lg:max-w-2xl h-36 -my-5 [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
                isHovering ? 'relative z-[11]' : ''
            )}
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
                        'animate-scroll [animation-direction:reverse]',
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
                        filteredOpportunitiesData.map((opportunity, index) => (
                            <CarouselItem key={index} className="basis-auto">
                                <InfoTooltip
                                    side="left"
                                    label={
                                        <LinkWrapper
                                            href={getOpportunityUrl({
                                                tokenAddress:
                                                    opportunity.token.address,
                                                protocol_identifier:
                                                    opportunity.platform
                                                        .protocol_identifier,
                                                chain_id:
                                                    opportunity.chain_id.toString(),
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
                                                <ImageWithBadge
                                                    mainImg={
                                                        opportunity?.token
                                                            ?.logo || ''
                                                    }
                                                    badgeImg={
                                                        getChainLogo({
                                                            chain_id:
                                                                opportunity.chain_id.toString(),
                                                            allChainsData,
                                                        }) || ''
                                                    }
                                                    mainImgAlt={
                                                        opportunity?.token
                                                            ?.name || ''
                                                    }
                                                    badgeImgAlt={
                                                        opportunity?.chain_id?.toString() ||
                                                        ''
                                                    }
                                                    mainImgWidth="24"
                                                    badgeImgWidth="10"
                                                    mainImgHeight="24"
                                                    badgeImgHeight="10"
                                                    badgeCustomClass="bottom-[0px] right-[1px]"
                                                />
                                                <BodyText
                                                    level="body2"
                                                    weight="medium"
                                                    className="select-none"
                                                >
                                                    {abbreviateNumber(
                                                        Number(
                                                            opportunity.platform
                                                                .apy.current
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
                                                        : 'Borrow'}{' '}
                                                    APY
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 items-center justify-start py-2 md:py-1">
                                                <ImageWithDefault
                                                    loading="lazy"
                                                    src={opportunity.token.logo}
                                                    alt={opportunity.token.name}
                                                    width={14}
                                                    height={14}
                                                    className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                                />
                                                <Label
                                                    weight="normal"
                                                    className="text-gray-700 truncate max-w-[150px]"
                                                >
                                                    {opportunity.token.name}
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 items-center justify-start py-2 md:py-1">
                                                <ImageWithDefault
                                                    loading="lazy"
                                                    src={
                                                        opportunity.platform
                                                            .logo
                                                    }
                                                    alt={
                                                        opportunity.platform
                                                            .name
                                                    }
                                                    width={14}
                                                    height={14}
                                                    className="object-contain shrink-0 rounded-full h-[14px] w-[14px] max-w-[14px] max-h-[14px]"
                                                />
                                                <Label
                                                    weight="normal"
                                                    className="text-gray-700 truncate max-w-[150px]"
                                                >
                                                    {opportunity.platform.name}
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 items-center justify-start max-md:py-2 md:pt-2">
                                                <ImageWithDefault
                                                    loading="lazy"
                                                    src={getChainLogo({
                                                        chain_id:
                                                            opportunity.chain_id.toString(),
                                                        allChainsData,
                                                    })}
                                                    alt={getChainName({
                                                        chain_id:
                                                            opportunity.chain_id.toString(),
                                                        allChainsData,
                                                    })}
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
                                                        tokenAddress:
                                                            opportunity.token
                                                                .address,
                                                        protocol_identifier:
                                                            opportunity.platform
                                                                .protocol_identifier,
                                                        chain_id:
                                                            opportunity.chain_id.toString(),
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

export default TokenRates
