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
const imageBaseUrl = 'https://superlend-assets.s3.ap-south-1.amazonaws.com'
const morphoImageBaseUrl = 'https://cdn.morpho.org/assets/logos'

// Token Addresses
const opportunity1TokenAddress = "0x2c03058c8afc06713be23e58d2febc8337dbfe6a";
const opportunity2TokenAddress = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf";
const opportunity3TokenAddress = "0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559";

// Chain IDs
const opportunity1ChainId = 42793;
const opportunity2ChainId = 8453;
const opportunity3ChainId = 1;

// Protocol Identifiers
const opportunity1ProtocolIdentifier = "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf";
const opportunity2ProtocolIdentifier = "0x2a2ef6e5ef864ff2361fb1aff63df8f60d12a43c704c8453ef76d9ea7d3edc81";
const opportunity3ProtocolIdentifier = "0x87eb69182347a95a4a9be4d83afdf0af705a0d7dd3e7d19f22e5cf34090f1d22";

export default function DiscoverOpportunities({ chain }: { chain: string }) {
    const { logEvent } = useAnalytics()
    const { showAllMarkets, isLoading: isStateLoading } = useShowAllMarkets()
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

    // Borrow Rate
    const asset1LendRate = opportunity1PlatformData.assets.find((asset: any) => asset.token.address === opportunity1TokenAddress)?.supply_apy
    // Description
    const description1 = `${asset1LendRate?.toFixed(2)}% APY`
    const description2 = `Upto ${getAssetDetails(opportunity2PlatformData, opportunity2TokenAddress)?.supply_apy?.toFixed(2)}% APY`
    // const description3 = opportunity3PlatformData?.apy

    // Opportunities
    const opportunities = [
        {
            id: 1,
            label: 'Etherlink Apple Farm',
            tokenSymbol: getAssetDetails(opportunity1PlatformData, opportunity1TokenAddress)?.token.symbol,
            platformName: 'Superlend',
            chainName: 'Etherlink',
            description: description1,
            tokenImage: getAssetDetails(opportunity1PlatformData, opportunity1TokenAddress)?.token.logo,
            platformImage: `${imageBaseUrl}/superlend.svg`,
            link: getRedirectLink(
                opportunity1TokenAddress,
                opportunity1ProtocolIdentifier,
                opportunity1ChainId,
                'borrow'
            ),
        },
        {
            id: 2,
            label: "Automated Strategy",
            tokenSymbol: `Seamless ${getAssetDetails(opportunity2PlatformData, opportunity2TokenAddress)?.token.symbol}`,
            platformName: "Morpho",
            chainName: "Base",
            description: description2,
            tokenImage: getAssetDetails(opportunity2PlatformData, opportunity2TokenAddress)?.token.logo,
            platformImage: `${imageBaseUrl}/morpho-logo.svg`,
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
                                                <Label
                                                    weight="medium"
                                                    className="text-gray-600"
                                                >
                                                    {opportunity.description}
                                                </Label>
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
    return platformData.assets.find((asset: any) => asset?.token?.address?.toLowerCase() === tokenAddress?.toLowerCase())
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

