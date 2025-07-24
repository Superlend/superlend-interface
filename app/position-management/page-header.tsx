'use client'

import ArrowLeftIcon from '@/components/icons/arrow-left-icon'
import { Button } from '@/components/ui/button'
import React, { useContext, useEffect } from 'react'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import {
    abbreviateNumber,
    convertAPRtoAPY,
    getLowestDisplayValue,
    getPlatformVersion,
    getPlatformWebsiteLink,
    getTokenLogo,
    hasLowestDisplayValuePrefix,
    isLowestValue,
} from '@/lib/utils'
import ImageWithDefault from '@/components/ImageWithDefault'
import { Skeleton } from '@/components/ui/skeleton'
import { notFound, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { AssetsDataContext } from '@/context/data-provider'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { TPlatform, TPlatformAsset } from '@/types/platform'
import { ChainId } from '@/types/chain'
import ArrowRightIcon from '@/components/icons/arrow-right-icon'
import {
    chainNamesBasedOnAaveMarkets,
    ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS,
    MORPHO_ETHERSCAN_TUTORIAL_LINK,
    PAIR_BASED_PROTOCOLS,
    platformWebsiteLinks,
    POOL_BASED_PROTOCOLS,
    WarningMessages,
} from '@/constants'
import { motion } from 'framer-motion'
import { getChainDetails, getTokenDetails } from './helper-functions'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import DangerSquare from '@/components/icons/danger-square'
import { PlatformType } from '@/types/platform'
import CustomAlert from '@/components/alerts/CustomAlert'
import { useGetMerklOpportunitiesData } from '@/hooks/useGetMerklOpportunitiesData'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import { Percent, TrendingUp } from 'lucide-react'
import useGetMidasKpiData from '@/hooks/useGetMidasKpiData'
import ExternalLink from '@/components/ExternalLink'

type TTokenDetails = {
    address: string
    symbol: string
    name: string
    logo: string
}

export default function PageHeader() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const tokenAddress = searchParams?.get('token') || searchParams?.get('lend_token') || ''
    const chain_id: string = searchParams?.get('chain_id') || '1'
    const protocol_identifier = searchParams?.get('protocol_identifier') || ''
    const positionTypeParam = searchParams?.get('position_type') || 'lend'
    const lendTokenAddress = searchParams?.get('lend_token') || ''
    const borrowTokenAddress = searchParams?.get('borrow_token') || ''
    const isLoopPosition = positionTypeParam === 'loop'
    const { allChainsData, allTokensData } = useContext(AssetsDataContext)
    const {
        hasAppleFarmRewards,
        appleFarmRewardsAprs,
        isLoading: isLoadingAppleFarmRewards
    } = useAppleFarmRewards()
    const { mBasisAPY, mTbillAPY } = useGetMidasKpiData()

    // Get opportunities data to access updated APY values (includes Midas API updates)
    const { data: opportunitiesData } = useGetOpportunitiesData({
        type: 'lend',
    })

    // Helper function to find opportunity data for enhanced APY calculation
    const findOpportunityAPY = (tokenAddress: string) => {
        if (!opportunitiesData?.length || !tokenAddress) return null
        const opportunity = opportunitiesData.find(item =>
            item.token.address.toLowerCase() === tokenAddress.toLowerCase() &&
            item.chain_id === Number(chain_id) &&
            item.platform.protocol_identifier === protocol_identifier
        )

        // Debug logging for Midas tokens
        if (opportunity && (opportunity.token.symbol.toUpperCase() === 'MTBILL' || opportunity.token.symbol.toUpperCase() === 'MBASIS')) {
            console.log(`Found opportunity APY for ${opportunity.token.symbol} in page header:`, {
                tokenAddress: opportunity.token.address,
                currentAPY: opportunity.platform.apy.current,
                tokenSymbol: opportunity.token.symbol
            })
        }

        return opportunity ? parseFloat(opportunity.platform.apy.current) : null
    }

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData,
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const tokenDetails: TTokenDetails = getTokenDetails({
        tokenAddress,
        platformData: platformData as TPlatform,
    })

    const chainDetails = getChainDetails({
        allChainsData,
        chainIdToMatch: chain_id,
    })

    // Error boundry
    useEffect(() => {
        const hasNoData =
            isErrorPlatformData ||
            (!tokenDetails?.symbol?.length && !chainDetails?.name?.length)
        if (hasNoData && !isLoadingPlatformData) {
            return notFound()
        }
    }, [
        isErrorPlatformData,
        tokenAddress,
        chain_id,
        protocol_identifier,
        isLoadingPlatformData,
    ])

    const isMorpho =
        platformData?.platform?.platform_name?.split('-')[0]?.toLowerCase() ===
        PlatformType.MORPHO
    const isVault = platformData?.platform?.isVault
    const isMorphoMarkets = isMorpho && !isVault
    const tokenSymbol = tokenDetails?.symbol
    const tokenLogo = tokenDetails?.logo || ''
    const tokenName = tokenDetails?.name || ''
    const chainName = chainDetails?.name || ''
    const chainLogo = chainDetails?.logo || ''
    const platformName = platformData?.platform?.name
    const platformType = platformData?.platform?.protocol_type
    const platformId = platformData?.platform?.platform_name
    const platformLogo = platformData?.platform?.logo
    const vaultId = platformData?.platform?.vaultId
    const morpho_market_id = platformData?.platform?.morpho_market_id
    const network_name = chainName
    const core_contract = platformData?.platform?.core_contract
    const isFluidLend =
        platformData?.platform?.protocol_type === PlatformType.FLUID &&
        !platformData?.platform?.isVault
    const isFluidVault =
        platformData?.platform?.protocol_type === PlatformType.FLUID &&
        platformData?.platform?.isVault
    const isMorphoVault =
        platformData?.platform?.protocol_type === PlatformType.MORPHO &&
        platformData?.platform?.isVault
    const isEulerProtocol = platformData?.platform?.protocol_type === PlatformType.EULER
    const platformWebsiteLink = getPlatformWebsiteLink({
        platformId,
        chainName,
        tokenAddress: isEulerProtocol ? core_contract : tokenDetails?.address,
        chainId: chain_id,
        vaultId,
        isFluidVault,
        isMorphoVault,
        core_contract,
        morpho_market_id,
        network_name,
    })

    const checkForPairBasedTokens = (
        platformTypes: string[],
        platformType: string
    ) => {
        if (isLoopPosition) {
            return true;
        };

        return platformTypes
            .map((type) => type?.toLowerCase())
            .includes(platformType?.toLowerCase())
    }

    const hasPoolBasedTokens = checkForPairBasedTokens(
        POOL_BASED_PROTOCOLS,
        platformType
    )

    const hasPairBasedTokens = checkForPairBasedTokens(
        PAIR_BASED_PROTOCOLS,
        platformType
    )

    const isFluidPlatform =
        platformData?.platform?.protocol_type === PlatformType.FLUID

    // If has Collateral Token, then get the Collateral token details
    const collateralTokenAddress = platformData.assets.find((asset: TPlatformAsset) => {
        if (isLoopPosition) {
            return asset.token.address.toLowerCase() === lendTokenAddress.toLowerCase()
        }
        return !asset.borrow_enabled
    })?.token?.address || ''
    const getCollateralTokenDetails = (tokenAddress: string) => {
        const collateralTokenDetails = allTokensData[Number(chain_id)]?.find(
            (token: any) =>
                token?.address?.toLowerCase() === tokenAddress?.toLowerCase()
        )
        return collateralTokenDetails
    }
    const collateralTokenDetails = getCollateralTokenDetails(
        collateralTokenAddress
    )

    // If has Loan Token, then get the loan token details
    const loanTokenAddress = platformData.assets.find((asset: TPlatformAsset) => {
        if (isLoopPosition) {
            return asset.token.address.toLowerCase() === borrowTokenAddress.toLowerCase()
        }
        return asset.borrow_enabled
    })?.token?.address || ''

    const getLoanTokenDetails = (tokenAddress: string) => {
        const loanTokenDetails = allTokensData[Number(chain_id)]?.find(
            (token: any) =>
                token?.address?.toLowerCase() === tokenAddress?.toLowerCase()
        )
        return loanTokenDetails
    }

    const loanTokenDetails = getLoanTokenDetails(loanTokenAddress)

    const hasWarnings =
        platformData.assets.filter(
            (asset: TPlatformAsset) => asset?.token?.warnings?.length > 0
        ).length > 0

    const warningMessages = platformData.assets
        .filter((asset: TPlatformAsset) => asset?.token?.warnings?.length > 0)
        ?.flatMap((asset: TPlatformAsset) => asset.token.warnings)

    const isDisplayOneToken =
        (hasPoolBasedTokens ||
            (isFluidPlatform && !isFluidVault) ||
            (isMorpho && isMorphoVault) ||
            isEulerProtocol) && !isLoopPosition

    const isDisplayTwoTokens = !(
        hasPoolBasedTokens ||
        (isFluidPlatform && !isFluidVault) ||
        (isMorpho && isMorphoVault) ||
        isEulerProtocol
    ) || isLoopPosition

    const tokensToDisplayOnTooltip = isDisplayOneToken
        ? [tokenDetails]
        : [collateralTokenDetails, loanTokenDetails]

    const pageHeaderStats = getPageHeaderStats({
        tokenAddress: isDisplayOneToken ? [tokenDetails?.address] : [collateralTokenDetails?.address, loanTokenDetails?.address],
        platformData: platformData as TPlatform,
        positionType: positionTypeParam,
    })

    // Enhanced supply APY calculation with opportunity data (includes Midas API updates)
    const relevantTokenAddress = isDisplayOneToken ? tokenDetails?.address : collateralTokenDetails?.address
    const relevantTokenSymbol = isDisplayOneToken ? tokenDetails?.symbol : collateralTokenDetails?.symbol
    const opportunityAPY = findOpportunityAPY(relevantTokenAddress)

    // Get base APY from opportunities data or platform data
    let baseSupplyAPY = opportunityAPY !== null ? opportunityAPY : Number(pageHeaderStats?.supply_apy || 0)

    // Add Midas intrinsic APY for mTBILL and mBASIS tokens
    let intrinsicAPY = 0
    if (relevantTokenSymbol?.toLowerCase() === 'mtbill') {
        intrinsicAPY = mTbillAPY || 0
    } else if (relevantTokenSymbol?.toLowerCase() === 'mbasis') {
        intrinsicAPY = mBasisAPY || 0
    }

    // If we have opportunity APY (from Midas API), it already includes intrinsic APY, so don't double-add it
    if (opportunityAPY === null && intrinsicAPY > 0) {
        baseSupplyAPY += intrinsicAPY
    }

    const appleFarmRewardAPY = Number(appleFarmRewardsAprs?.[relevantTokenAddress] ?? 0)
    const formattedSupplyAPY = baseSupplyAPY + appleFarmRewardAPY

    // console.log('Page Header APY calculation:', {
    //     tokenSymbol: relevantTokenSymbol,
    //     tokenAddress: relevantTokenAddress,
    //     opportunityAPY,
    //     platformSupplyAPY: pageHeaderStats?.supply_apy,
    //     intrinsicAPY,
    //     baseSupplyAPY,
    //     // appleFarmRewardAPY,
    //     formattedSupplyAPY,
    //     isDisplayOneToken
    // })

    const formattedBorrowRate = (isMorphoVault || isFluidLend)
        ? 'N/A'
        : (
            <>
                {isLowestValue(
                    Number(
                        pageHeaderStats?.borrow_rate ?? 0
                    )
                )
                    ? `${hasLowestDisplayValuePrefix(
                        Number(
                            pageHeaderStats?.borrow_rate ?? 0
                        )
                    )}${getLowestDisplayValue(
                        Number(
                            pageHeaderStats?.borrow_rate ?? 0
                        )
                    )}`
                    : abbreviateNumber(
                        Number(
                            pageHeaderStats?.borrow_rate ?? 0
                        ),
                        2
                    )}%
            </>
        )

    return (
        <>
            {hasWarnings && (
                <div className="flex flex-col gap-4">
                    {warningMessages.map((message: any, index: number) => (
                        <AlertWarning
                            key={index}
                            description={
                                WarningMessages[
                                message.type as keyof typeof WarningMessages
                                ]
                            }
                        />
                    ))}
                </div>
            )}
            {/* {((isMorpho && !isVault) && positionTypeParam === 'lend') && <MorphoMarketAlert />} */}
            <section className="header relative z-[20] flex flex-col sm:flex-row items-start gap-[24px]">
                <motion.div
                    className="will-change-transform"
                // initial={{ opacity: 0.7, y: 30 }}
                // animate={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                >
                    <Button
                        className="py-[8px] px-[12px] rounded-3"
                        onClick={() => router.back()}
                    >
                        <ArrowLeftIcon
                            width={16}
                            height={16}
                            className="stroke-gray-800"
                        />
                    </Button>
                </motion.div>
                <div className="flex flex-col xl:flex-row items-start justify-between gap-[24px] w-full">
                    <motion.div
                        className="flex flex-wrap items-center gap-[16px] will-change-transform"
                    // initial={{ opacity: 0.7, y: 30 }}
                    // animate={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                    >
                        {/* Loading Skeleton */}
                        {isLoadingPlatformData && <LoadingSkeleton />}
                        {/* Token Details */}
                        {tokenDetails?.symbol &&
                            chainDetails?.logo &&
                            !isLoadingPlatformData && (
                                <div className="flex items-center flex-wrap gap-[12px]">
                                    {/* Pool Based Tokens and Fluid Lend Token */}
                                    {isDisplayOneToken && (
                                        <div className="one-token flex items-center gap-[8px]">
                                            <ImageWithDefault
                                                src={tokenLogo}
                                                alt={`${tokenName} Token Logo`}
                                                width={28}
                                                height={28}
                                                className="rounded-full max-w-[28px] max-h-[28px] object-contain"
                                            />
                                            <HeadingText
                                                level="h4"
                                                weight="medium"
                                                className="break-words text-gray-800"
                                            >
                                                {tokenSymbol}
                                            </HeadingText>
                                        </div>
                                    )}
                                    {/* Pair Based Tokens and Fluid Vault Token */}
                                    {isDisplayTwoTokens && (
                                        <>
                                            <div className="two-tokens collateral-token flex items-center gap-[8px]">
                                                <ImageWithDefault
                                                    src={
                                                        collateralTokenDetails?.logo
                                                    }
                                                    alt={`${collateralTokenDetails?.name}`}
                                                    width={28}
                                                    height={28}
                                                    className="rounded-full max-w-[28px] max-h-[28px] object-contain"
                                                />
                                                <HeadingText
                                                    level="h4"
                                                    weight="medium"
                                                    className="break-words text-gray-800"
                                                >
                                                    {
                                                        collateralTokenDetails?.symbol
                                                    }
                                                </HeadingText>
                                            </div>
                                            <BodyText
                                                level="body1"
                                                weight="medium"
                                                className="text-gray-500"
                                            >
                                                /
                                            </BodyText>
                                            <div className="two-tokens loan-token flex items-center gap-[8px]">
                                                <ImageWithDefault
                                                    src={loanTokenDetails?.logo}
                                                    alt={`${loanTokenDetails?.name}`}
                                                    width={28}
                                                    height={28}
                                                    className="rounded-full max-w-[28px] max-h-[28px]"
                                                />
                                                <HeadingText
                                                    level="h4"
                                                    weight="medium"
                                                    className="text-gray-800"
                                                >
                                                    {loanTokenDetails?.symbol}
                                                </HeadingText>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        {/* Platform Details */}
                        <div className="flex items-center gap-[12px]">
                            {!isLoadingPlatformData && platformLogo && (
                                <Badge
                                    size="md"
                                    className={`border-0 flex items-center justify-between gap-[16px] ${isLoopPosition ? 'pr-2.5' : 'pl-[6px] pr-1'} w-fit max-w-[400px]`}
                                >
                                    <div className="flex items-center gap-1">
                                        <ImageWithDefault
                                            src={chainLogo}
                                            alt={`${chainName}`}
                                            width={16}
                                            height={16}
                                            className="object-contain shrink-0 max-w-[16px] max-h-[16px]"
                                        />
                                        <Label
                                            weight="medium"
                                            className="leading-[0] shrink-0 capitalize"
                                        >
                                            {chainName?.toLowerCase()}
                                        </Label>
                                    </div>
                                    {!isLoopPosition &&
                                        (<a
                                            className="inline-block w-fit h-full rounded-2 ring-1 ring-gray-300 flex items-center gap-[4px] hover:bg-secondary-100/15 py-1 px-2"
                                            href={platformWebsiteLink}
                                            target="_blank"
                                        >
                                            <span className="uppercase text-secondary-500 font-medium">
                                                {platformId.split('-')[0]}{' '}
                                                {getPlatformVersion(platformId)}
                                            </span>
                                            <ArrowRightIcon
                                                weight="3"
                                                className="stroke-secondary-500 -rotate-45"
                                            />
                                        </a>)}
                                </Badge>
                            )}
                            {/* Info Tooltip */}
                            <InfoTooltip
                                size="lg"
                                content={getAssetTooltipContent({
                                    tokensToDisplayOnTooltip,
                                    chainName,
                                    chainLogo,
                                    platformName,
                                    platformLogo,
                                    hasPairBasedTokens,
                                })}
                            />
                        </div>
                    </motion.div>
                    {/* Page Header Stats */}
                    <motion.div
                        className="header-right flex flex-wrap items-center shrink-0 gap-[24px]"
                    // initial={{ opacity: 0.7, y: 30 }}
                    // animate={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                    >
                        {/* Loading Skeleton */}
                        {isLoadingPlatformData && (
                            <Skeleton className="w-[80%] sm:w-[300px] h-[35px] rounded-4" />
                        )}
                        {!isLoadingPlatformData && (
                            <>
                                {/* Supply APY */}
                                {!isMorphoMarkets && (
                                    <>
                                        <div className="flex items-center max-md:justify-between gap-[4px]">
                                            <BodyText
                                                level="body1"
                                                className="text-gray-700 shrink-0"
                                            >
                                                Supply APY
                                            </BodyText>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="green">
                                                    <BodyText
                                                        level="body1"
                                                        weight="medium"
                                                    >
                                                        {isLowestValue(
                                                            Number(
                                                                formattedSupplyAPY
                                                            )
                                                        )
                                                            ? `${hasLowestDisplayValuePrefix(
                                                                Number(
                                                                    formattedSupplyAPY
                                                                )
                                                            )}${getLowestDisplayValue(
                                                                Number(
                                                                    formattedSupplyAPY
                                                                )
                                                            )}`
                                                            : abbreviateNumber(
                                                                Number(
                                                                    formattedSupplyAPY
                                                                ),
                                                                2
                                                            )}%
                                                    </BodyText>
                                                </Badge>
                                                {/* Apple Farm Rewards Icon */}
                                                {(Number(chain_id) === ChainId.Etherlink &&
                                                    hasAppleFarmRewards(relevantTokenAddress)
                                                    //   appleFarmRewardAPY > 0
                                                ) && (
                                                        <InfoTooltip
                                                            label={
                                                                <motion.div
                                                                    initial={{ rotate: 0 }}
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 1.5, repeat: 0, ease: "easeInOut" }}
                                                                    whileHover={{ rotate: -360 }}
                                                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                                >
                                                                    <ImageWithDefault
                                                                        src="/images/apple-farm-favicon.ico"
                                                                        alt="Apple Farm Rewards"
                                                                        width={16}
                                                                        height={16}
                                                                    />
                                                                </motion.div>
                                                            }
                                                            content={getSupplyAPYBreakdownTooltip({
                                                                baseSupplyAPY: (relevantTokenSymbol?.toLowerCase() === 'mtbill' || relevantTokenSymbol?.toLowerCase() === 'mbasis')
                                                                    ? 0
                                                                    : formattedSupplyAPY - appleFarmRewardAPY - intrinsicAPY,
                                                                intrinsicAPY: intrinsicAPY,
                                                                appleFarmAPY: appleFarmRewardAPY,
                                                                totalSupplyAPY: formattedSupplyAPY,
                                                                tokenSymbol: relevantTokenSymbol,
                                                                hasOpportunityAPY: opportunityAPY !== null,
                                                            })}
                                                        />
                                                    )}
                                            </div>
                                        </div>
                                        <span className="hidden xs:inline-block text-gray">
                                            |
                                        </span>
                                    </>
                                )}
                                {/* Borrow Rate */}
                                <div className="flex items-center max-md:justify-between gap-[4px]">
                                    <BodyText
                                        level="body1"
                                        className="text-gray-700 shrink-0"
                                    >
                                        Borrow Rate
                                    </BodyText>
                                    <Badge variant="yellow">
                                        <BodyText level="body1" weight="medium">
                                            {formattedBorrowRate}
                                        </BodyText>
                                    </Badge>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </section>
        </>
    )
}

// Helper functions =================================================

function getPageHeaderStats({
    tokenAddress,
    platformData,
    positionType,
}: {
    tokenAddress: string[]
    platformData: TPlatform
    positionType: string
}) {
    // console.log('platformData', platformData)
    // console.log('tokenAddress', tokenAddress)
    const stats = platformData?.assets
        ?.filter(
            (asset: TPlatformAsset) =>
                asset?.token?.address?.toLowerCase() ===
                tokenAddress[0]?.toLowerCase() ||
                asset?.token?.address?.toLowerCase() ===
                tokenAddress[1]?.toLowerCase()
        )
        .reduce((acc: any, item: TPlatformAsset, currentIndex: number, array: TPlatformAsset[]) => {
            // Special handling for loop positions
            if (positionType === 'loop') {
                // For loop positions: supply_apy from 0th index token, borrow_rate from 1st index token (if borrow enabled)
                if (item.token.address.toLowerCase() === tokenAddress[0]?.toLowerCase()) {
                    acc.supply_apy = item.supply_apy
                } else if (item.token.address.toLowerCase() === tokenAddress[1]?.toLowerCase() && item.borrow_enabled) {
                    acc.borrow_rate = item.variable_borrow_apy
                }
            } else {
                if (!item.borrow_enabled && array.length > 1) {
                    acc.supply_apy = item.supply_apy
                } else if (item.borrow_enabled && array.length > 1) {
                    acc.supply_apy = item.supply_apy
                } else {
                    acc.supply_apy = item.supply_apy
                    acc.borrow_rate = item.variable_borrow_apy
                }
            }
            return acc
        }, {})

    // console.log('stats', stats)

    return stats
}

function getAssetTooltipContent({
    tokensToDisplayOnTooltip,
    chainName,
    chainLogo,
    platformLogo,
    platformName,
    hasPairBasedTokens,
}: {
    tokensToDisplayOnTooltip: TPlatformAsset['token'][]
    chainName: string
    chainLogo: string
    platformLogo: string
    platformName: string
    hasPairBasedTokens: boolean
}) {
    const TooltipData = [
        ...tokensToDisplayOnTooltip.map(
            (token: TPlatformAsset['token'], index: number) => {
                const labels = ['Token', 'Collateral Token', 'Loan Token']

                return {
                    label: labels[hasPairBasedTokens ? index + 1 : index],
                    image: token?.logo || '',
                    imageAlt: token?.name,
                    displayName: token?.symbol,
                }
            }
        ),
        {
            label: 'Chain',
            image: chainLogo || '',
            imageAlt: chainName,
            displayName: `${chainName?.slice(0, 1)}${chainName?.toLowerCase().slice(1)}`,
        },
        {
            label: 'Platform',
            image: platformLogo || '',
            imageAlt: platformName,
            displayName: platformName,
        },
    ]
    return (
        <span className="flex flex-col gap-[16px] max-w-[200px]">
            {TooltipData.map((item) => (
                <span key={item.label} className="flex flex-col gap-[4px]">
                    <Label>{item.label}</Label>
                    <span className="flex items-center gap-[8px] max-w-full">
                        <ImageWithDefault
                            alt={item.imageAlt}
                            src={item.image}
                            width={24}
                            height={24}
                            className="max-w-[24px] max-h-[24px]"
                        />
                        <BodyText level="body1" weight="medium" className='break-all'>
                            {item.displayName}
                        </BodyText>
                    </span>
                </span>
            ))}
        </span>
    )
}

function getAssetDetails({
    tokenDetails,
    chainDetails,
    platformData,
}: {
    tokenDetails: TTokenDetails
    chainDetails: any
    platformData: any
}) {
    const tokenSymbol = tokenDetails?.symbol
    const tokenLogo = tokenDetails?.logo
    const tokenName = tokenDetails?.name
    const chainName = chainDetails?.name
    const chainLogo = chainDetails?.logo
    const platformName = platformData.platform.name
    const platformId = platformData.platform.platform_name
    const platformLogo = platformData?.platform.logo
    const vaultId = platformData?.platform?.vaultId
    const morpho_market_id = platformData?.platform?.morpho_market_id
    const network_name = chainName
    const platformWebsiteLink = getPlatformWebsiteLink({
        platformId,
        chainName,
        tokenAddress: tokenDetails?.address,
        chainId: chainDetails?.id,
        vaultId,
        morpho_market_id,
        network_name,
    })

    return {
        tokenSymbol,
        tokenLogo,
        tokenName,
        chainName,
        chainLogo,
        platformName,
        platformLogo,
        platformWebsiteLink,
    }
}

// Child Components =================================================

function LoadingSkeleton() {
    return (
        <div className="flex items-center gap-[12px]">
            <div className="flex items-center gap-[8px]">
                <Skeleton className="w-[28px] h-[28px] rounded-full" />
                <Skeleton className="w-[60px] h-[28px] rounded-4" />
            </div>
            <BodyText level="body1" weight="medium" className="text-gray-500">
                /
            </BodyText>
            <div className="flex items-center gap-[8px]">
                <Skeleton className="w-[28px] h-[28px] rounded-full" />
                <Skeleton className="w-[60px] h-[28px] rounded-4" />
            </div>
        </div>
    )
}

function AlertWarning({ description }: { description: string }) {
    return (
        <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-center gap-2">
                {/* <TriangleAlert strokeWidth={1.75} className='h-4 w-4' /> */}
                <DangerSquare
                    width={18}
                    height={18}
                    className="stroke-destructive-foreground shrink-0"
                />
                <span className="leading-0 font-medium">{description}</span>
            </AlertDescription>
        </Alert>
    )
}

function MorphoMarketAlert() {
    return (
        <div className="w-full">
            <CustomAlert
                variant="info"
                hasPrefixIcon={false}
                description={
                    <div className="flex flex-col gap-[4px]">
                        <BodyText level="body2" weight="normal">
                            <span className="font-medium">Note:</span>
                            <span className="mx-2">
                                Supplying directly to Morpho markets is risky.
                                It requires knowledge, and the right tools to
                                manage risks properly, and there is a chance
                                that your deposit may become illiquid. More
                                details can be found
                            </span>
                            <a
                                href={MORPHO_ETHERSCAN_TUTORIAL_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-fit shrink-0 inline-flex items-center gap-[4px] text-secondary-500 border-b border-secondary-500 hover:border-secondary-500/40 leading-[0.5]"
                            >
                                here
                                <ArrowRightIcon
                                    weight="3"
                                    className="stroke-secondary-500 -rotate-45"
                                />
                            </a>
                        </BodyText>
                    </div>
                }
            />
        </div>
    )
}

/**
 * Get supply APY breakdown tooltip content with Apple Farm rewards and intrinsic APY
 * @param baseSupplyAPY
 * @param intrinsicAPY
 * @param appleFarmAPY
 * @param totalSupplyAPY
 * @param tokenSymbol
 * @param hasOpportunityAPY
 * @returns supply APY breakdown tooltip content
 */
function getSupplyAPYBreakdownTooltip({
    baseSupplyAPY,
    intrinsicAPY,
    appleFarmAPY,
    totalSupplyAPY,
    tokenSymbol,
    hasOpportunityAPY,
}: {
    baseSupplyAPY: number
    intrinsicAPY: number
    appleFarmAPY: number
    totalSupplyAPY: number
    tokenSymbol: string
    hasOpportunityAPY: boolean
}) {
    return (
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800"
            >
                Supply APY Breakdown
            </BodyText>
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <Percent className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Base APY
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    {abbreviateNumber(baseSupplyAPY, 2)}%
                </BodyText>
            </div>
            {/* Intrinsic APY for mTBILL and mBASIS */}
            {intrinsicAPY > 0 && (tokenSymbol?.toLowerCase() === 'mtbill' || tokenSymbol?.toLowerCase() === 'mbasis') && (
                <div
                    className="flex items-center justify-between gap-[70px] py-2"
                    style={{ gap: '70px' }}
                >
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-[14px] h-[14px] text-gray-800" />
                        <Label weight="medium" className="text-gray-800">
                            Intrinsic APY
                        </Label>
                    </div>
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-800"
                    >
                        + {abbreviateNumber(intrinsicAPY, 2)}%
                    </BodyText>
                </div>
            )}
            {appleFarmAPY > 0 && (
                <div
                    className="flex items-center justify-between gap-[100px] py-2"
                    style={{ gap: '70px' }}
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src="/images/apple-farm-favicon.ico"
                            width={14}
                            height={14}
                            alt="Apple Farm"
                            className="inline-block rounded-full object-contain"
                        />
                        <Label
                            weight="medium"
                            className="truncate text-gray-800 max-w-[100px] truncate"
                            title="Apple Farm APR"
                        >
                            Apple Farm APR
                        </Label>
                    </div>
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-800"
                    >
                        + {abbreviateNumber(appleFarmAPY, 2)}%
                    </BodyText>
                </div>
            )}
            <div
                className="flex items-center justify-between gap-[100px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-[14px] h-[14px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">
                        Total APY
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    = {abbreviateNumber(totalSupplyAPY, 2)}%
                </BodyText>
            </div>
        </div>
    )
}
