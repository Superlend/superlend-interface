'use client'

import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import React from 'react'
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
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import { useGetEffectiveApy } from '@/hooks/useGetEffectiveApy'
import { useGetLoopPairs } from '@/hooks/useGetLoopPairs'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'
import { useContext } from 'react'
const imageBaseUrl = 'https://superlend-assets.s3.ap-south-1.amazonaws.com'
const morphoImageBaseUrl = 'https://cdn.morpho.org/assets/logos'

// Token Addresses
const opportunity1TokenAddress = "0x2c03058c8afc06713be23e58d2febc8337dbfe6a";
const opportunity2TokenAddress = "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f";
const opportunity3TokenAddress = "0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559";
const opportunity4TokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913"; // USDC on Base
const opportunity5TokenAddress = "0x4200000000000000000000000000000000000006"; // WETH on Base
const opportunity6TokenAddress = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E"; // crvUSD on Ethereum
const opportunity7TokenAddress = '0x2416092f143378750bb29b79eD961AB195CcEea5'; // weETH on Etherlink
const opportunity8TokenAddress = '0x82f95A2193498119c3c13345A7831393A4033b0A'; // ezETH on Etherlink
const opportunity9TokenAddress = '0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559'; // wusdl on Etherlink (placeholder for another loop)

// Chain IDs
const opportunity1ChainId = 42793;
const opportunity2ChainId = 1;
const opportunity3ChainId = 1;
const opportunity4ChainId = 8453; // Base
const opportunity5ChainId = 8453; // Base
const opportunity6ChainId = 1; // Ethereum
const opportunity7ChainId = 42793; // Etherlink
const opportunity8ChainId = 42793; // Etherlink
const opportunity9ChainId = 42793; // Etherlink

// Protocol Identifiers
const opportunity1ProtocolIdentifier = "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf";
const opportunity2ProtocolIdentifier = "0x36015e6d9a714a91078f6c479b6ff9ce197a1137779118c91f9acb35668129a9";
const opportunity3ProtocolIdentifier = "0x87eb69182347a95a4a9be4d83afdf0af705a0d7dd3e7d19f22e5cf34090f1d22";
const opportunity4ProtocolIdentifier = "0x1b3c946c1b3c946c1b3c946c1b3c946c1b3c946c1b3c946c1b3c946c1b3c946c"; // Placeholder for Aave Base
const opportunity5ProtocolIdentifier = "0x2c4d5b2c4d5b2c4d5b2c4d5b2c4d5b2c4d5b2c4d5b2c4d5b2c4d5b2c4d5b2c4d"; // Placeholder for Compound Base
const opportunity6ProtocolIdentifier = "0x87eb69182347a95a4a9be4d83afdf0af705a0d7dd3e7d19f22e5cf34090f1d22"; // Morpho on Ethereum
const opportunity7ProtocolIdentifier = "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf"; // Superlend on Etherlink
const opportunity8ProtocolIdentifier = "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf"; // Superlend on Etherlink
const opportunity9ProtocolIdentifier = "0xd68cf3aa73c75811ca1665efe01a10524ed5adcba0f412df44d78f04f1c902bf"; // Superlend on Etherlink

export default function DiscoverOpportunities({ chain, positionType }: { chain: string, positionType: string }) {
    const { logEvent } = useAnalytics()
    const { showAllMarkets, isLoading: isStateLoading } = useShowAllMarkets()
    const { hasAppleFarmRewards, appleFarmRewardsAprs, isLoading: isLoadingAppleFarmRewards } = useAppleFarmRewards()
    const { allChainsData } = useContext<any>(AssetsDataContext)
    
    // Get loop pairs data for top 3 strategies
    const { pairs: loopPairs, isLoading: isLoadingLoopPairs } = useGetLoopPairs()
    
    // Get opportunities data for borrow APYs
    const { data: borrowOpportunitiesData, isLoading: isLoadingBorrowOpportunities } = useGetOpportunitiesData({
        type: 'borrow'
    })
    
    const SUPERFUNDS_DOMAIN = 'https://funds.superlend.xyz'
    const BASE_CHAIN_ID = 8453
    const BASE_VAULT_ADDRESS = '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B'
    const { data: effectiveApyData, isLoading: isLoadingEffectiveApy, isError: isErrorEffectiveApy } = useGetEffectiveApy({
        vault_address: BASE_VAULT_ADDRESS as `0x${string}`,
        chain_id: BASE_CHAIN_ID
    })
    const { data: BOOST_APY, isLoading: isLoadingBoostRewards, error: errorBoostRewards } = useGetBoostRewards({
        vaultAddress: BASE_VAULT_ADDRESS as `0x${string}`,
        chainId: BASE_CHAIN_ID
    })
    const TOTAL_VAULT_APY = abbreviateNumber(Number(effectiveApyData?.total_apy ?? 0) + Number((BOOST_APY?.[0]?.boost_apy ?? 0) / 100))
    // Platform Data
    const { data: opportunity1PlatformData, isLoading: isLoading1 } =
        useGetPlatformData({
            chain_id: opportunity1ChainId,
            protocol_identifier: opportunity1ProtocolIdentifier,
        })
    // const { data: opportunity2PlatformData, isLoading: isLoading2 } =
    //     useGetPlatformData({
    //         chain_id: opportunity2ChainId,
    //         protocol_identifier: opportunity2ProtocolIdentifier,
    //     })
    const { data: opportunity3PlatformData, isLoading: isLoading3 } =
        useGetPlatformData({
            chain_id: opportunity3ChainId,
            protocol_identifier: opportunity3ProtocolIdentifier,
        })
    const { data: opportunity4PlatformData, isLoading: isLoading4 } =
        useGetPlatformData({
            chain_id: opportunity4ChainId,
            protocol_identifier: opportunity4ProtocolIdentifier,
        })
    const { data: opportunity5PlatformData, isLoading: isLoading5 } =
        useGetPlatformData({
            chain_id: opportunity5ChainId,
            protocol_identifier: opportunity5ProtocolIdentifier,
        })
    const { data: opportunity6PlatformData, isLoading: isLoading6 } =
        useGetPlatformData({
            chain_id: opportunity6ChainId,
            protocol_identifier: opportunity6ProtocolIdentifier,
        })
    const { data: opportunity7PlatformData, isLoading: isLoading7 } =
        useGetPlatformData({
            chain_id: opportunity7ChainId,
            protocol_identifier: opportunity7ProtocolIdentifier,
        })
    const { data: opportunity8PlatformData, isLoading: isLoading8 } =
        useGetPlatformData({
            chain_id: opportunity8ChainId,
            protocol_identifier: opportunity8ProtocolIdentifier,
        })
    const { data: opportunity9PlatformData, isLoading: isLoading9 } =
        useGetPlatformData({
            chain_id: opportunity9ChainId,
            protocol_identifier: opportunity9ProtocolIdentifier,
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
    if (!opportunity1PlatformData?.assets || isLoadingBoostRewards || isLoadingEffectiveApy || !opportunity3PlatformData) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FullCardSkeleton />
                    <FullCardSkeleton />
                    <FullCardSkeleton />
                </div>
            </div>
        )
    }

    // Helper function to get borrow APY for a token (matching table calculation)
    const getBorrowAPY = (tokenSymbol: string, chainId?: number) => {
        if (!borrowOpportunitiesData) return 0
        
        const opportunity = borrowOpportunitiesData.find(opp => 
            opp.token.symbol.toLowerCase() === tokenSymbol.toLowerCase() &&
            (chainId ? opp.chain_id === chainId : true)
        )
        
        if (!opportunity) return 0
        
        // For borrow APY, we use the same field as the table but interpret it correctly
        // The table shows this as a cost (negative), so we should too
        const borrowRate = Number(opportunity.platform.apy.current)
        
        // Return negative value to indicate this is a cost (what you pay for borrowing)
        return -Math.abs(borrowRate)
    }

    // Get top 3 borrow opportunities - one per platform based on highest APY
    const getTop3BorrowOpportunities = () => {
        if (!borrowOpportunitiesData || borrowOpportunitiesData.length === 0) {
            // Fallback to static borrow opportunities if no dynamic data is available
            return [
                {
                    id: 4,
                    label: 'Borrow USDC on Base',
                    tokenSymbol: 'USDC',
                    platformName: 'Aave',
                    chainName: 'Base',
                    description: 'Low borrow rates',
                    tokenImage: `/images/tokens/usdc.webp`,
                    platformImage: `${imageBaseUrl}/aave.svg`,
                    link: getRedirectLink(
                        opportunity4TokenAddress,
                        opportunity4ProtocolIdentifier,
                        opportunity4ChainId,
                        'borrow'
                    ),
                },
                {
                    id: 5,
                    label: 'Borrow BTC on Base',
                    tokenSymbol: 'BTC',
                    platformName: 'Compound',
                    chainName: 'Base',
                    description: 'Competitive rates',
                    tokenImage: `/images/tokens/btc.webp`,
                    platformImage: `${imageBaseUrl}/compound.svg`,
                    link: getRedirectLink(
                        opportunity5TokenAddress,
                        opportunity5ProtocolIdentifier,
                        opportunity5ChainId,
                        'borrow'
                    ),
                },
                {
                    id: 6,
                    label: 'Borrow crvUSD on Ethereum',
                    tokenSymbol: 'crvUSD',
                    platformName: 'Morpho',
                    chainName: 'Ethereum',
                    description: 'Efficient borrowing',
                    tokenImage: `${morphoImageBaseUrl}/crvusd.svg`,
                    platformImage: `${imageBaseUrl}/morpho-logo.svg`,
                    link: getRedirectLink(
                        opportunity6TokenAddress,
                        opportunity6ProtocolIdentifier,
                        opportunity6ChainId,
                        'borrow'
                    ),
                },
            ]
        }
        
        // Apply the same filtering logic as the table to ensure consistency
        const EXCLUDED_TOKENS_LIST = [
            '0x89c31867c878e4268c65de3cdf8ea201310c5851',
        ]
        
        const EXCLUDED_PROTOCOLS_LIST = [
            '0x3d819db807d8f8ca10dfef283a3cf37d5576a2abcec9cfb6874efd2df8f4b6ed',
            '0xe75f6fff3eec59db6ac1df4fcccf63b72cc053f78e3156b9eb78d12f5ac47367',
        ]
        
        const filteredBorrowData = borrowOpportunitiesData.filter(opportunity => {
            const isExcludedToken = EXCLUDED_TOKENS_LIST.includes(opportunity.token.address)
            const isExcludedProtocol = EXCLUDED_PROTOCOLS_LIST.includes(opportunity.platform.protocol_identifier)
            return !isExcludedToken && !isExcludedProtocol
        })
        
        // Group opportunities by platform name
        const platformGroups = filteredBorrowData.reduce((acc, opportunity) => {
            const platformName = opportunity.platform.platform_name.split('-')[0].toLowerCase()
            if (!acc[platformName]) {
                acc[platformName] = []
            }
            acc[platformName].push(opportunity)
            return acc
        }, {} as Record<string, any[]>)
        
        // Get the best opportunity from each platform (lowest borrow rate = best for borrowing)
        const bestOpportunityPerPlatform = Object.entries(platformGroups).map(([platformName, opportunities]) => {
            // For borrow opportunities, lower APY is better (you pay less interest)
            const bestOpportunity = opportunities.sort((a, b) => 
                Number(a.platform.apy.current) - Number(b.platform.apy.current)
            )[0]
            
            return {
                ...bestOpportunity,
                platformDisplayName: platformName.charAt(0).toUpperCase() + platformName.slice(1)
            }
        })
        
        // Sort by APY (lowest first = best borrow rates) and take top 3
        const top3Opportunities = bestOpportunityPerPlatform
            .sort((a, b) => Number(a.platform.apy.current) - Number(b.platform.apy.current))
            .slice(0, 3)
        
        // Map to the required format
        return top3Opportunities.map((opportunity, index) => {
            const chainName = allChainsData?.find((chain: any) => 
                Number(chain.chain_id) === Number(opportunity.chain_id)
            )?.name || 'Unknown'
            
            // For borrow opportunities, manually add negative sign to match table display
            const borrowRate = Number(opportunity.platform.apy.current)
            const apyValue = borrowRate // Keep the raw value for internal use
            
            return {
                id: 4 + index,
                label: `Borrow ${opportunity.token.symbol} on ${chainName}`,
                tokenSymbol: opportunity.token.symbol,
                platformName: opportunity.platformDisplayName,
                chainName: chainName,
                description: `${abbreviateNumber(apyValue)}% APY`, // Manually add negative sign to show it's a cost
                tokenImage: opportunity.token.logo,
                platformImage: opportunity.platform.logo,
                link: getRedirectLink(
                    opportunity.token.address,
                    opportunity.platform.protocol_identifier,
                    opportunity.chain_id,
                    'borrow'
                ),
                apy: -apyValue // Store negative value to match table behavior
            }
        })
    }

    // Get top 3 loop strategies by APY
    const getTop3LoopStrategies = () => {
        if (!loopPairs || loopPairs.length === 0) {
            // Fallback to static loop opportunities if no dynamic data is available
            return [
                {
                    id: 7,
                    label: 'Loop with weETH',
                    tokenSymbol: 'weETH/WETH',
                    platformName: 'Superlend',
                    chainName: 'Etherlink',
                    description: 'Leverage your staking rewards',
                    tokenImage: `/images/tokens/weeth.png`,
                    borrowTokenImage: `${imageBaseUrl}/tokens/weth.png`,
                    platformImage: `${imageBaseUrl}/superlend.svg`,
                    link: getRedirectLink(
                        opportunity7TokenAddress,
                        opportunity7ProtocolIdentifier,
                        opportunity7ChainId,
                        'loop',
                        '0xfc24f770f94edbca6d6f885e12d4317320bcb401' // WETH on Etherlink
                    ),
                    maxAPY: 0,
                    isLoopPair: true
                },
                {
                    id: 8,
                    label: 'Loop with ezETH',
                    tokenSymbol: 'ezETH/WETH',
                    platformName: 'Superlend',
                    chainName: 'Etherlink',
                    description: 'Maximize your yield with looping',
                    tokenImage: `/images/tokens/ezeth.png`,
                    borrowTokenImage: `${imageBaseUrl}/tokens/weth.png`,
                    platformImage: `${imageBaseUrl}/superlend.svg`,
                    link: getRedirectLink(
                        opportunity8TokenAddress,
                        opportunity8ProtocolIdentifier,
                        opportunity8ChainId,
                        'loop',
                        '0xfc24f770f94edbca6d6f885e12d4317320bcb401' // WETH on Etherlink
                    ),
                    maxAPY: 0,
                    isLoopPair: true
                },
                {
                    id: 9,
                    label: 'Loop with wusdl',
                    tokenSymbol: 'wusdl/USDC',
                    platformName: 'Superlend',
                    chainName: 'Etherlink',
                    description: 'Loop stablecoins for enhanced yield',
                    tokenImage: `${morphoImageBaseUrl}/wusdl.svg`,
                    borrowTokenImage: `/images/tokens/usdc.webp`,
                    platformImage: `${imageBaseUrl}/superlend.svg`,
                    link: getRedirectLink(
                        opportunity9TokenAddress,
                        opportunity9ProtocolIdentifier,
                        opportunity9ChainId,
                        'loop',
                        '0x2c03058c8afc06713be23e58d2febc8337dbfe6a' // USDC on Etherlink
                    ),
                    maxAPY: 0,
                    isLoopPair: true
                },
            ]
        }
        
        // Sort by maxAPY and take top 3
        return loopPairs
            .sort((a, b) => b.maxAPY - a.maxAPY)
            .slice(0, 3)
            .map((pair, index) => ({
                id: 7 + index,
                label: `Loop ${pair.tokenSymbol}/${pair.borrowToken.symbol}`,
                tokenSymbol: `${pair.tokenSymbol}/${pair.borrowToken.symbol}`,
                platformName: pair.platformName,
                chainName: pair.chainName,
                description: `${abbreviateNumber(pair.maxAPY)}% Max APY`,
                tokenImage: pair.tokenLogo,
                borrowTokenImage: pair.borrowToken.logo,
                platformImage: pair.platformLogo,
                link: getRedirectLink(
                    pair.tokenAddress,
                    pair.protocol_identifier,
                    pair.chain_id,
                    'loop',
                    pair.borrowToken.address
                ),
                maxAPY: pair.maxAPY,
                isLoopPair: true
            }))
    }

    const asset1Data = opportunity1PlatformData?.assets?.find((asset: any) =>
        asset?.token?.address === opportunity1TokenAddress
    )
    const asset1AppleFarmRewardsApy = appleFarmRewardsAprs[opportunity1TokenAddress] ?? 0
    const asset1LendRate = Number(asset1Data?.supply_apy || 0) + (asset1AppleFarmRewardsApy ?? 0)
    const asset1DataSupplyApy = Number(asset1Data?.supply_apy || 0)
    // Description
    const description1 = `${abbreviateNumber(asset1LendRate)}% APY`
    const description2 = `Upto ${TOTAL_VAULT_APY}% APY`
    // const description3 = opportunity3PlatformData?.apy
    const asset1ChainName = opportunity1PlatformData?.platform?.chain_id
        ? CHAIN_ID_MAPPER[opportunity1PlatformData.platform.chain_id as keyof typeof CHAIN_ID_MAPPER]
        : "Unknown"
    const asset2ChainName = BASE_CHAIN_ID
        ? CHAIN_ID_MAPPER[BASE_CHAIN_ID as keyof typeof CHAIN_ID_MAPPER]
        : "Unknown"

    // Opportunities
    const opportunities: {
        lend: any[],
        borrow: any[],
        loop: any[],
    } = {
            lend: [
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
                        'lend'
                    ),
                    hasAppleFarmRewards: hasAppleFarmRewards(opportunity1TokenAddress),
                },
                {
                    id: 2,
                    label: "Automated Strategy",
                    tokenSymbol: "USDC",
                    platformName: "SuperFund", // Rebalanced across multiple protocols
                    chainName: 'Base',
                    description: description2 || "0.00% APY",
                    tokenImage: `/images/tokens/usdc.webp`,
                    platformImages: [
                        `${imageBaseUrl}/aave.svg`,
                        `${imageBaseUrl}/morpho-logo.svg`,
                        `${imageBaseUrl}/fluid_logo.png`,
                        `${SUPERFUNDS_DOMAIN}/images/logos/euler-symbol.svg`,
                    ],
                    link: `${SUPERFUNDS_DOMAIN}/super-fund/base`,
                    linkTarget: '_blank',
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
            ],
            borrow: getTop3BorrowOpportunities(),
            loop: getTop3LoopStrategies(),
        }

    const appleFarmBaseRate = asset1DataSupplyApy
    const appleFarmBaseRateFormatted = appleFarmBaseRate < 0.01 && appleFarmBaseRate > 0
        ? '<0.01'
        : appleFarmBaseRate.toFixed(2)

    const appleFarmRewards = [
        {
            asset: {
                address: opportunity1TokenAddress as `0x${string}`,
                name: "APR",
                symbol: getAssetDetails(opportunity1PlatformData, opportunity1TokenAddress)?.token?.symbol || "",
                logo: '/images/apple-farm-favicon.ico',
                decimals: 0,
                price_usd: 0,
            },
            supply_apy: appleFarmRewardsAprs[opportunity1TokenAddress] ?? 0,
            borrow_apy: 0,
        }
    ]

    const isLoading: { [key: number]: boolean } = {
        1: isLoading1,
        2: (isLoadingBoostRewards || isLoadingEffectiveApy),
        3: isLoading3,
        4: isLoadingBorrowOpportunities,
        5: isLoadingBorrowOpportunities,
        6: isLoadingBorrowOpportunities,
        7: isLoadingLoopPairs,
        8: isLoadingLoopPairs,
        9: isLoadingLoopPairs,
    }

    const cardsToRender = opportunities[positionType as keyof typeof opportunities] || opportunities.lend;

    return (
        <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsToRender.map((opportunity: any, index: number) => (
                isLoading[opportunity.id] ? (
                    <FullCardSkeleton key={`skeleton-${opportunity.id}`} />
                ) : (
                    <div
                        key={opportunity.id}
                        className="group overflow-hidden relative bg-white rounded-5 px-5 py-6 lg:hover:shadow-md lg:hover:shadow-gray-200/50 lg:hover:rounded-7 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        {index === 0 && positionType === 'lend' && <RainingApples />}
                        <Link
                            href={opportunity.link}
                            target={opportunity?.linkTarget ?? '_self'}
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
                                <div className="flex items-center gap-2">
                                    {/* Render stacked icons for loop pairs, single icon for others */}
                                    {opportunity.isLoopPair && opportunity.borrowTokenImage ? (
                                        <div className="relative flex items-center">
                                            <ImageWithDefault
                                                src={opportunity.tokenImage}
                                                alt={opportunity.tokenSymbol}
                                                width={36}
                                                height={36}
                                                className="rounded-full object-contain"
                                            />
                                            <ImageWithDefault
                                                src={opportunity.borrowTokenImage}
                                                alt={`${opportunity.tokenSymbol} borrow token`}
                                                width={24}
                                                height={24}
                                                className="rounded-full object-contain -ml-3 border-2 border-white"
                                            />
                                        </div>
                                    ) : (
                                        <ImageWithDefault
                                            src={opportunity.tokenImage}
                                            alt={opportunity.tokenSymbol}
                                            width={36}
                                            height={36}
                                            className="rounded-full object-contain"
                                        />
                                    )}
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
                                </div>
                            </div>
                            {(!!opportunity.platformImage || !!opportunity.platformImages) && (
                                opportunity.platformImages ? (
                                    <ProtocolLogosGrid images={opportunity.platformImages} />
                                ) : (
                                    <div className="absolute -right-5 -bottom-5 group-hover:-right-2 group-hover:-bottom-2 transition-all duration-300">
                                        <ImageWithDefault
                                            src={opportunity.platformImage || ''}
                                            alt={opportunity.platformName || ''}
                                            width={124}
                                            height={136}
                                            className="object-contain origin-center -rotate-45 opacity-15 lg:group-hover:opacity-100 transition-all duration-300"
                                        />
                                    </div>
                                )
                            )}
                        </Link>
                    </div>
                )
            ))}
        </div>
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

function FullCardSkeleton() {
    return (
        <div className="overflow-hidden relative bg-white rounded-5 px-5 py-6 transition-all duration-300">
            <div className="flex flex-col gap-[53px] relative z-10">
                {/* Badge skeleton */}
                <Skeleton className="w-32 h-6 rounded-md bg-gray-300" />
                
                {/* Token and details skeleton */}
                <div className="flex items-center gap-2">
                    <Skeleton className="w-9 h-9 rounded-full bg-gray-300" />
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-20 h-5 rounded-md bg-gray-300" />
                            <Skeleton className="w-12 h-4 rounded-md bg-gray-300" />
                        </div>
                        <Skeleton className="w-16 h-3 rounded-md bg-gray-300" />
                    </div>
                </div>
            </div>
            
            {/* Platform logo skeleton */}
            <div className="absolute -right-5 -bottom-5">
                <Skeleton className="w-[124px] h-[136px] rounded-lg bg-gray-300 opacity-15" />
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
function getRedirectLink(tokenAddress: string, protocolIdentifier: string, chainId: number, positionType: string, borrowTokenAddress?: string) {
    if (positionType === 'loop' && borrowTokenAddress) {
        return `/position-management?lend_token=${tokenAddress}&borrow_token=${borrowTokenAddress}&protocol_identifier=${protocolIdentifier}&chain_id=${chainId}&position_type=${positionType}`
    }
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

// Add this new component before the RainingApples component
const ProtocolLogosGrid = ({ images }: { images: string[] }) => {
    return (
        <div className="absolute -right-4 -bottom-2 flex flex-wrap items-center justify-center gap-2 -rotate-45 p-2 bg-white/50 rounded-lg transform opacity-15 lg:group-hover:opacity-100 lg:group-hover:scale-105 lg:group-hover:-translate-y-5 lg:group-hover:bottom-0 lg:group-hover:right-1 max-w-[100px] transition-all duration-300">
            {images.map((image, index) => (
                <ImageWithDefault
                    key={index}
                    src={image}
                    alt={`Protocol ${index + 1}`}
                    width={32}
                    height={32}
                    className="object-contain"
                />
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

