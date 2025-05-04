'use client'

import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import ImageWithDefault from '@/components/ImageWithDefault'
import Link from 'next/link'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import Image from 'next/image';
import { useShowAllMarkets } from '@/context/show-all-markets-provider'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { abbreviateNumber, convertAPRtoAPY } from '@/lib/utils'
import { TReward } from '@/types'
import { ChartNoAxesColumnIncreasing, TrendingUp } from 'lucide-react'
import { CHAIN_ID_MAPPER } from '@/constants'
const imageBaseUrl = 'https://superlend-assets.s3.ap-south-1.amazonaws.com'
const morphoImageBaseUrl = 'https://cdn.morpho.org/assets/logos'

// Token Addresses
const opportunity1TokenAddress = "0x2c03058c8afc06713be23e58d2febc8337dbfe6a";
const opportunity2TokenAddress = "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f";
const opportunity3TokenAddress = "0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559";

// Chain IDs
const opportunity1ChainId = 42793;
const opportunity2ChainId = 1;
const opportunity3ChainId = 1;

// Protocol Identifiers
const opportunity1ProtocolIdentifier = "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf";
const opportunity2ProtocolIdentifier = "0x36015e6d9a714a91078f6c479b6ff9ce197a1137779118c91f9acb35668129a9";
const opportunity3ProtocolIdentifier = "0x87eb69182347a95a4a9be4d83afdf0af705a0d7dd3e7d19f22e5cf34090f1d22";

export default function DiscoverOpportunities({ chain }: { chain: string }) {
    const { logEvent } = useAnalytics()
    const { showAllMarkets, isLoading: isStateLoading } = useShowAllMarkets()
    const { hasAppleFarmRewards, appleFarmRewardsAprs, isLoading: isLoadingAppleFarmRewards } = useAppleFarmRewards()
    // Platform Data
    const { data: opportunity1PlatformData, isLoading: isLoading1 } =
        useGetPlatformData({
            chain_id: opportunity1ChainId,
            protocol_identifier: opportunity1ProtocolIdentifier,
        })
    const { data: opportunity2PlatformData, isLoading: isLoading2 } =
        useGetPlatformData({
            chain_id: opportunity2ChainId,
            protocol_identifier: opportunity2ProtocolIdentifier,
        })
    const { data: opportunity3PlatformData, isLoading: isLoading3 } =
        useGetPlatformData({
            chain_id: opportunity3ChainId,
            protocol_identifier: opportunity3ProtocolIdentifier,
        })

    // Don't render anything while loading
    if (isStateLoading) {
        return null
    }

    // Only render for discover route when showing all markets
    if (!showAllMarkets) {
        return null
    }

    // Add checks for platform data existence
    if (!opportunity1PlatformData?.assets || !opportunity2PlatformData?.assets || !opportunity3PlatformData) {
        return <div className="p-5"><CardDetailsSkeleton /></div>
    }

    const asset1Data = opportunity1PlatformData?.assets?.find((asset: any) => 
        asset?.token?.address === opportunity1TokenAddress
    )
    const asset1AppleFarmRewardsApy = convertAPRtoAPY((appleFarmRewardsAprs[opportunity1TokenAddress] ?? 0) / 100)
    const asset1LendRate = Number(asset1Data?.supply_apy || 0) + (asset1AppleFarmRewardsApy ?? 0)
    const asset1DataSupplyApy = Number(asset1Data?.supply_apy || 0)
    // Description
    const description1 = `${asset1LendRate?.toFixed(2)}% APY`
    const description2 = `Upto ${getAssetDetails(opportunity2PlatformData, opportunity2TokenAddress)?.supply_apy?.toFixed(2) || "0.00"}% APY`
    // const description3 = opportunity3PlatformData?.apy
    const asset1ChainName = opportunity1PlatformData?.platform?.chain_id 
        ? CHAIN_ID_MAPPER[opportunity1PlatformData.platform.chain_id as keyof typeof CHAIN_ID_MAPPER] 
        : "Unknown"
    const asset2ChainName = opportunity2PlatformData?.platform?.chain_id 
        ? CHAIN_ID_MAPPER[opportunity2PlatformData.platform.chain_id as keyof typeof CHAIN_ID_MAPPER]
        : "Unknown"

    // Opportunities
    const opportunities: {
        id: number,
        label: string,
        tokenSymbol: string,
        platformName: string,
        chainName: string,
        description: string,
        tokenImage: string,
        platformImage: string,
        link: string,
        hasAppleFarmRewards?: boolean,
    }[] = [
            {
                id: 1,
                label: 'Etherlink Apple Farm',
                tokenSymbol: getAssetDetails(opportunity1PlatformData, opportunity1TokenAddress)?.token?.symbol || "TEZOS",
                platformName: 'Superlend',
                chainName: asset1ChainName || 'Etherlink',
                description: description1 || "0.00% APY",
                tokenImage: getAssetDetails(opportunity1PlatformData, opportunity1TokenAddress)?.token?.logo || "",
                platformImage: `${imageBaseUrl}/superlend.svg`,
                link: getRedirectLink(
                    opportunity1TokenAddress,
                    opportunity1ProtocolIdentifier,
                    opportunity1ChainId,
                    'borrow'
                ),
                hasAppleFarmRewards: hasAppleFarmRewards(opportunity1TokenAddress),
            },
            {
                id: 2,
                label: "Automated Strategy",
                tokenSymbol: getAssetDetails(opportunity2PlatformData, opportunity2TokenAddress)?.token?.symbol || "wstETH",
                platformName: "Morpho",
                chainName: asset2ChainName || 'Ethereum',
                description: description2 || "0.00% APY",
                tokenImage: getAssetDetails(opportunity2PlatformData, opportunity2TokenAddress)?.token?.logo || "",
                platformImage: `${imageBaseUrl}/fluid_logo.png`,
                link: getRedirectLink(
                    opportunity2TokenAddress,
                    opportunity2ProtocolIdentifier,
                    opportunity2ChainId,
                    'lend'
                ),
            },
            {
                id: 3,
                label: 'Assured Airdrop',
                tokenSymbol: 'Coinshift Vault',
                platformName: 'Morpho',
                chainName: 'Ethereum',
                description: '+ 25% APY in SHIFT tokens',
                tokenImage: `${morphoImageBaseUrl}/wusdl.svg`,
                platformImage: `${imageBaseUrl}/morpho-logo.svg`,
                link: getRedirectLink(
                    opportunity3TokenAddress,
                    opportunity3ProtocolIdentifier,
                    opportunity3ChainId,
                    'lend'
                ),
            },
        ]

    const appleFarmBaseRate = asset1DataSupplyApy
    const appleFarmBaseRateFormatted = appleFarmBaseRate < 0.01 && appleFarmBaseRate > 0
        ? '<0.01'
        : appleFarmBaseRate.toFixed(2)

    const appleFarmRewards = [
        {
            asset: {
                address: opportunity1TokenAddress as `0x${string}`,
                name: "APY",
                symbol: getAssetDetails(opportunity1PlatformData, opportunity1TokenAddress)?.token?.symbol || "",
                logo: '/images/apple-farm-favicon.ico',
                decimals: 0,
                price_usd: 0,
            },
            supply_apy: convertAPRtoAPY((appleFarmRewardsAprs[opportunity1TokenAddress] ?? 0) / 100),
            borrow_apy: 0,
        }
    ]

    const isLoading: { [key: number]: boolean } = {
        1: isLoading1,
        2: isLoading2,
        3: isLoading3,
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 px-5">
                <HeadingText
                    level="h3"
                    weight="medium"
                    className="text-gray-800"
                >
                    Discover Opportunities
                </HeadingText>
            </div>

            <Carousel className="overflow-hidden max-w-full px-5">
                <CarouselContent className="gap-4 ml-0">
                    {opportunities.map((opportunity, index) => (
                        <CarouselItem
                            key={opportunity.id}
                            className="group overflow-hidden relative basis-[90%] md:basis-[380px] bg-white rounded-5 px-5 py-6 lg:hover:shadow-md lg:hover:shadow-gray-200/50 lg:hover:rounded-7 active:scale-95 transition-all duration-300 cursor-pointer"
                        >
                            {index === 0 && <RainingApples />}
                            <Link
                                href={opportunity.link}
                                onClick={() => {
                                    logEvent('discover_opportunity_clicked', {
                                        token: opportunity.tokenSymbol,
                                        platform: opportunity.platformName,
                                        chain: opportunity.chainName,
                                    })
                                }}
                            >
                                <div className="flex flex-col gap-[53px] relative z-10">
                                    <Badge
                                        variant="green"
                                        size="lg"
                                        className="w-fit rounded-md uppercase"
                                    >
                                        {opportunity.label}
                                    </Badge>
                                    {isLoading[index + 1] ?
                                        (<CardDetailsSkeleton />)
                                        : (<div className="flex items-center gap-2">
                                            <ImageWithDefault
                                                src={opportunity.tokenImage}
                                                alt={opportunity.tokenSymbol}
                                                width={36}
                                                height={36}
                                                className="rounded-full object-contain"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <HeadingText
                                                        level="h4"
                                                        weight="medium"
                                                        className="text-gray-800"
                                                    >
                                                        {opportunity.tokenSymbol}
                                                    </HeadingText>
                                                    <Badge
                                                        variant="gray"
                                                        className="w-fit rounded-md uppercase px-1"
                                                    >
                                                        <Label
                                                            weight="medium"
                                                            className="text-black tracking-wide"
                                                        >
                                                            {opportunity.chainName}
                                                        </Label>
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Label
                                                        weight="medium"
                                                        className="text-gray-600"
                                                    >
                                                        {opportunity.description}
                                                    </Label>
                                                    {opportunity.hasAppleFarmRewards &&
                                                        <InfoTooltip
                                                            label={
                                                                <ImageWithDefault
                                                                    src={'/images/logos/apple-green.png'}
                                                                    alt={'apple icon'}
                                                                    width={18}
                                                                    height={18}
                                                                    className="object-contain"
                                                                />
                                                            }
                                                            content={getRewardsTooltipContent({
                                                                baseRateFormatted: appleFarmBaseRateFormatted || '',
                                                                rewards: appleFarmRewards || [],
                                                                apyCurrent: asset1LendRate || 0,
                                                                positionTypeParam: 'lend',
                                                                netApyIcon: '/images/apple-farm-favicon.ico',
                                                            })}
                                                        />
                                                    }
                                                </div>
                                            </div>
                                        </div>)
                                    }
                                </div>
                                <div className="absolute -right-5 -bottom-5 group-hover:-right-2 group-hover:-bottom-2 transition-all duration-300">
                                    <ImageWithDefault
                                        src={opportunity.platformImage}
                                        alt={opportunity.platformName}
                                        width={124}
                                        height={136}
                                        className="object-contain origin-center -rotate-45 opacity-15 lg:group-hover:opacity-100 transition-all duration-300"
                                    />
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    )
}

// Helper Functions
function CardDetailsSkeleton() {
    return (
        <div className="flex items-center gap-2 w-full">
            <Skeleton
                className="w-12 h-12 rounded-full bg-gray-300"
            />
            <div className="flex flex-col gap-1">
                <Skeleton
                    className="w-24 h-4 rounded-md bg-gray-300"
                />
                <Skeleton
                    className="w-12 h-2 rounded-md bg-gray-300"
                />
            </div>
        </div>
    )
}

// Helper Functions
function getAssetDetails(platformData: any, tokenAddress: string) {
    if (!platformData?.assets || !tokenAddress) return null;
    return platformData.assets.find((asset: any) => 
        asset?.token?.address?.toLowerCase() === tokenAddress?.toLowerCase()
    );
}
function getRedirectLink(tokenAddress: string, protocolIdentifier: string, chainId: number, positionType: string) {
    return `/position-management?token=${tokenAddress}&protocol_identifier=${protocolIdentifier}&chain_id=${chainId}&position_type=${positionType}`
}

const RainingApples = () => {
    const apples = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        size: 16 + Math.random() * 8,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none group-hover:[&>div>div>img]:scale-150 transition-all duration-300">
            {apples.map((apple) => (
                <div
                    key={apple.id}
                    className="absolute animate-fall"
                    style={{
                        left: apple.left,
                        top: '-30px',
                        animationDelay: apple.delay,
                    }}
                >
                    <div className="animate-spin">
                        <Image
                            src="/images/logos/apple-green.png"
                            alt="falling apple"
                            width={apple.size}
                            height={apple.size}
                            className="object-contain transition-transform duration-300"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Get rewards tooltip content
 * @param baseRateFormatted
 * @param rewards
 * @param apyCurrent
 * @returns rewards tooltip content
 */
function getRewardsTooltipContent({
    baseRateFormatted,
    rewards,
    apyCurrent,
    positionTypeParam,
    netApyIcon,
}: {
    baseRateFormatted: string
    rewards: TReward[]
    apyCurrent: number
    positionTypeParam: string
    netApyIcon?: string
}) {
    const baseRateOperator = positionTypeParam === 'lend' ? '+' : '-'
    const isLend = positionTypeParam === 'lend'

    return (
        <div className="flex flex-col divide-y divide-gray-400">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800/75"
            >
                Rate & Rewards
            </BodyText>
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <ChartNoAxesColumnIncreasing className="w-[16px] h-[16px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Base rate
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    {baseRateFormatted}%
                </BodyText>
            </div>
            {rewards?.map((reward: TReward) => (
                <div
                    key={reward.asset.address}
                    className="flex items-center justify-between gap-[100px] py-2"
                    style={{ gap: '70px' }}
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src={reward?.asset?.logo || ''}
                            width={16}
                            height={16}
                            alt={reward?.asset?.name || ''}
                            className="inline-block rounded-full object-contain"
                        />
                        <Label
                            weight="medium"
                            className="truncate text-gray-800 max-w-[100px] truncate"
                            title={reward?.asset?.name || ''}
                        >
                            {reward?.asset?.name || ''}
                        </Label>
                    </div>
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-800"
                    >
                        {baseRateOperator}{' '}
                        {`${(Math.floor(Number(isLend ? reward.supply_apy : reward.borrow_apy) * 100) / 100).toFixed(2)}%`}
                    </BodyText>
                </div>
            ))}
            <div
                className="flex items-center justify-between gap-[100px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Net APY
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    = {abbreviateNumber(apyCurrent)}%
                </BodyText>
            </div>
        </div>
    )
}

