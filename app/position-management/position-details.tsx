'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useSearchParams } from 'next/navigation'
import React, { useContext } from 'react'
import { motion } from 'framer-motion'
import {
    abbreviateNumber,
    capitalizeText,
    convertScientificToNormal,
    getLiquidationRisk,
    getRiskFactor,
    hasLowestDisplayValuePrefix,
    isLowestValue,
} from '@/lib/utils'
import { AssetsDataContext } from '@/context/data-provider'
import AvatarCircles from '@/components/ui/avatar-circles'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { PAIR_BASED_PROTOCOLS } from '@/constants'
import { Skeleton } from '@/components/ui/skeleton'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import Image from 'next/image'
import { useActiveAccount, useIsAutoConnecting } from 'thirdweb/react'
import TooltipText from '@/components/tooltips/TooltipText'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { EstimatedReturns } from './estimated-returns'
import { getStatDisplayValue } from './helper-functions'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import useGetPlatformHistoryData from '@/hooks/useGetPlatformHistoryData'

export default function PositionDetails() {
    const searchParams = useSearchParams()
    const { allChainsData } = useContext(AssetsDataContext)
    const chain_id = searchParams.get('chain_id') || 0
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address
    const isAutoConnecting = useIsAutoConnecting()

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData,
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    const isLoading =
        isLoadingPortfolioData || isLoadingPlatformData || isAutoConnecting

    const isPairBasedProtocol = PAIR_BASED_PROTOCOLS.includes(
        platformData?.platform?.protocol_type
    )
    const isAaveV3 = platformData?.platform?.protocol_type === 'aaveV3'

    // Get user positions from portfolio data using protocol identifier
    const userPositions = portfolioData?.platforms.filter(
        (platform) =>
            platform?.protocol_identifier?.toLowerCase() ===
            (platformData?.platform as any)?.protocol_identifier?.toLowerCase()
    )

    // Format user positions
    const [formattedUserPositions] = userPositions?.map(
        (platform, index: number) => {
            const lendPositions = platform.positions.filter(
                (position) => position.type === 'lend'
            )
            const borrowPositions = platform.positions.filter(
                (position) => position.type === 'borrow'
            )
            const chainDetails = allChainsData.find(
                (chain) => chain.chain_id === platform.chain_id
            )

            function getSanitizedValue(value: number) {
                const normalValue = Number(convertScientificToNormal(value))
                return isLowestValue(normalValue)
                    ? normalValue?.toFixed(20)
                    : normalValue
            }

            const lendAmount = getSanitizedValue(platform?.total_liquidity)
            const borrowAmount = getSanitizedValue(platform?.total_borrow)

            return {
                lendAsset: {
                    tokenImages: lendPositions.map(
                        (position) => position.token.logo
                    ),
                    tokenDetails: lendPositions.map((position) => ({
                        logo: position.token.logo,
                        symbol: position.token.symbol,
                        amount: getSanitizedValue(
                            position.amount * position.token.price_usd
                        ),
                        liquidation_threshold: position.liquidation_threshold,
                        tokenAmount: position.amount,
                    })),
                    amount: lendAmount,
                },
                borrowAsset: {
                    tokenImages: borrowPositions.map(
                        (position) => position.token.logo
                    ),
                    tokenDetails: borrowPositions.map((position) => ({
                        logo: position.token.logo,
                        symbol: position.token.symbol,
                        amount: getSanitizedValue(
                            position.amount * position.token.price_usd
                        ),
                        tokenAmount: position.amount,
                    })),
                    amount: borrowAmount,
                },
                positionOn: {
                    platformName: capitalizeText(
                        platform?.platform_name.split('-').join(' ')
                    ),
                    platformImage: platform?.logo ?? '',
                    chainName: chainDetails?.name ?? '',
                    chainImage: chainDetails?.logo ?? '',
                },
                riskFactor: getRiskFactor(platform.health_factor),
            }
        }
    )

    // Calculate borrow power and borrow power used for pool based assets
    function getLiquidationDetailsForPoolBasedAssets() {
        let borrowPower = 0
        let borrowPowerUsed = 0
        let collatAmt = 0
        let assetLogos: string[] = []
        let assetSymbols: string[] = []
        let assetDetails: any[] = []

        for (const platform of userPositions) {
            for (const position of platform.positions) {
                if (position.type === 'lend') {
                    borrowPower +=
                        ((position.amount * position.liquidation_threshold) /
                            100) *
                        position.token.price_usd
                    collatAmt += position.amount * position.token.price_usd
                    assetLogos.push(position.token.logo)
                    assetSymbols.push(position.token.symbol)
                    assetDetails.push({
                        logo: position.token.logo,
                        symbol: position.token.symbol,
                        amount: position.amount,
                    })
                } else {
                    borrowPowerUsed +=
                        position.amount * position.token.price_usd
                }
            }
        }

        const liquidationThreshold = borrowPower / collatAmt
        const liquidationPrice = borrowPowerUsed / liquidationThreshold
        const liquidationPercentage = (borrowPowerUsed / borrowPower) * 100

        // console.log(borrowPower);

        return {
            assetLogos,
            assetSymbols,
            liquidationPrice,
            liquidationPercentage,
            riskFactor: getLiquidationRisk(liquidationPercentage, 50, 80),
            hasBorrowed: borrowPower > 0,
            assetDetails,
        }
    }

    // Calculate borrow power and borrow power used for pair based assets
    function getLiquidationDetailsForPairBasedAssets() {
        const numerator =
            Number(
                formattedUserPositions?.borrowAsset?.tokenDetails[0]?.amount
            ) || 0
        const denominator =
            Number(
                formattedUserPositions?.lendAsset?.tokenDetails[0]
                    ?.liquidation_threshold
            ) / 100
        const tokenAmount = Number(
            formattedUserPositions?.lendAsset?.tokenDetails[0]?.tokenAmount
        )
        const liquidationPrice = numerator / (denominator * tokenAmount)
        const liquidationPercentage =
            (Number(
                formattedUserPositions?.borrowAsset?.tokenDetails[0]?.amount
            ) *
                100) /
            (Number(
                formattedUserPositions?.lendAsset?.tokenDetails[0]?.amount
            ) *
                denominator)
        const assetDetails = formattedUserPositions?.lendAsset?.tokenDetails

        return {
            assetLogos: [
                formattedUserPositions?.lendAsset?.tokenDetails[0]?.logo,
            ],
            assetSymbols: [
                formattedUserPositions?.lendAsset?.tokenDetails[0]?.symbol,
            ],
            liquidationPrice,
            liquidationPercentage,
            riskFactor: getLiquidationRisk(liquidationPercentage, 50, 80),
            hasBorrowed: numerator > 0,
            assetDetails,
        }
    }

    const {
        liquidationPrice,
        liquidationPercentage,
        riskFactor,
        hasBorrowed,
        assetLogos,
        assetSymbols,
        assetDetails,
    } = isAaveV3
        ? getLiquidationDetailsForPoolBasedAssets()
        : getLiquidationDetailsForPairBasedAssets()

    // Liquidation details
    const liquidationDetails = {
        liquidationPrice: liquidationPrice,
        assetLogos,
        assetSymbols,
        percentage: liquidationPercentage,
        riskFactor,
        hasBorrowed,
        assetDetails,
    }

    // Loading state
    if (isLoading) {
        return <LoadingSectionSkeleton className="h-[250px]" />
    }

    // If user is not connected, show connect wallet button
    // if (!isLoading && !walletAddress) {
    //     return (
    //         <motion.div
    //             className='flex flex-col gap-6 items-center justify-center h-full bg-white bg-opacity-75 rounded-6 px-5 py-12'
    //             initial={{ opacity: 0, y: 30 }}
    //             animate={{ opacity: 1, y: 0 }}
    //             transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
    //         >
    //             <BodyText level='body1' className='text-center'>Please connect your wallet to view your positions.</BodyText>
    //             <ConnectWalletButton />
    //         </motion.div>
    //     )
    // }

    // If user is connected, but does not have any positions, show estimated returns
    if (!isLoading && userPositions.length === 0) {
        return <EstimatedReturns platformDetails={platformData} />
    }

    // console.log(formattedUserPositions?.borrowAsset.amount);

    // If user is connected, and has positions, show position details
    return (
        <motion.section
            className={`bg-white bg-opacity-40 px-[16px] rounded-6 ${isPairBasedProtocol && userPositions.length > 0 ? 'pt-[32px] pb-[16px]' : 'py-[16px]'}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
        >
            {(isAaveV3 || isPairBasedProtocol) && userPositions.length > 0 && (
                <div className="px-[16px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-[12px]">
                        <div className="flex items-center gap-[8px]">
                            <BodyText level="body2" className="capitalize">
                                Liquidation Risk
                            </BodyText>
                            {/* If numerator is greater than 0, show the risk factor badge */}
                            {liquidationDetails.hasBorrowed && (
                                <Badge
                                    variant={
                                        liquidationDetails.riskFactor.theme as
                                            | 'destructive'
                                            | 'yellow'
                                            | 'green'
                                    }
                                >
                                    {liquidationDetails.riskFactor.label} risk
                                </Badge>
                            )}
                            {/* If numerator is 0, show the "No liquidation risk" badge */}
                            {!liquidationDetails.hasBorrowed && (
                                <Badge variant="default">N/A</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-[16px]">
                            <BodyText level="body2" className="capitalize">
                                Liquidation price
                            </BodyText>
                            <div className="flex items-center gap-[6px]">
                                {isPairBasedProtocol && (
                                    <ImageWithDefault
                                        src={liquidationDetails.assetLogos[0]}
                                        alt={liquidationDetails.assetSymbols[0]}
                                        width={16}
                                        height={16}
                                        className="rounded-full max-w-[16px] max-h-[16px]"
                                    />
                                )}
                                {!isPairBasedProtocol && (
                                    <AvatarCircles
                                        avatarUrls={
                                            liquidationDetails.assetLogos
                                        }
                                        // avatarDetails={liquidationDetails.assetDetails.map(asset => ({
                                        //     content: `${hasLowestDisplayValuePrefix(Number(asset.amount))} $${getStatDisplayValue(asset.amount, false)}`,
                                        //     title: asset.symbol
                                        // }))}
                                    />
                                )}
                                {liquidationDetails.hasBorrowed &&
                                    liquidationDetails.liquidationPrice !==
                                        0 && (
                                        <BodyText level="body1" weight="medium">
                                            $
                                            {abbreviateNumber(
                                                liquidationDetails.liquidationPrice
                                            )}
                                        </BodyText>
                                    )}
                                {(!liquidationDetails.hasBorrowed ||
                                    liquidationDetails.liquidationPrice ===
                                        0) && (
                                    <BodyText level="body1" weight="normal">
                                        <InfoTooltip
                                            label={
                                                <TooltipText className="text-gray-600">
                                                    N/A
                                                </TooltipText>
                                            }
                                            content="You do not have any borrows in this vault"
                                        />
                                    </BodyText>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="progress-bar mb-[20px]">
                        <Progress
                            value={liquidationDetails.percentage}
                            variant={
                                liquidationDetails.riskFactor.theme as
                                    | 'destructive'
                                    | 'yellow'
                                    | 'green'
                            }
                        />
                    </div>
                </div>
            )}
            <div className="bg-white rounded-4 py-[32px] px-[22px] md:px-[44px]">
                {isLoading && <Skeleton className="w-full h-[100px]" />}
                {!isLoading && userPositions.length > 0 && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Your Collateral
                            </BodyText>
                            <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                <div className="flex items-center gap-[6px]">
                                    <AvatarCircles
                                        avatarUrls={
                                            formattedUserPositions?.lendAsset
                                                ?.tokenImages ?? []
                                        }
                                        avatarDetails={formattedUserPositions?.lendAsset?.tokenDetails?.map(
                                            (token) => ({
                                                content: `${hasLowestDisplayValuePrefix(Number(token.amount))} $${getStatDisplayValue(token.amount, false)}`,
                                                title: token.symbol,
                                            })
                                        )}
                                    />
                                    <HeadingText
                                        level="h3"
                                        weight="medium"
                                        className="text-gray-800"
                                    >
                                        $
                                        {abbreviateNumber(
                                            Number(
                                                formattedUserPositions
                                                    ?.lendAsset.amount ?? 0
                                            )
                                        )}
                                    </HeadingText>
                                </div>
                                {/* <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                withdraw
                            </Button> */}
                            </div>
                        </div>
                        <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Your Borrowing
                            </BodyText>
                            <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                <div className="flex items-center gap-[6px]">
                                    <AvatarCircles
                                        avatarUrls={
                                            formattedUserPositions?.borrowAsset
                                                ?.tokenImages ?? []
                                        }
                                        avatarDetails={formattedUserPositions?.borrowAsset?.tokenDetails?.map(
                                            (token) => ({
                                                content: `${hasLowestDisplayValuePrefix(Number(token.amount))} $${getStatDisplayValue(token.amount, false)}`,
                                                title: token.symbol,
                                            })
                                        )}
                                    />
                                    <HeadingText
                                        level="h3"
                                        weight="medium"
                                        className="text-gray-800"
                                    >
                                        $
                                        {abbreviateNumber(
                                            Number(
                                                formattedUserPositions
                                                    ?.borrowAsset.amount ?? 0
                                            )
                                        )}
                                    </HeadingText>
                                </div>
                                {/* <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                repay
                            </Button> */}
                            </div>
                        </div>
                    </div>
                )}
                {!isLoading && userPositions.length === 0 && (
                    <div className="flex flex-col gap-[12px] items-center justify-center h-full">
                        <Image
                            src="/icons/notification-lines-removed.svg"
                            alt="No positions found"
                            width={24}
                            height={24}
                        />
                        <BodyText
                            level="body1"
                            weight="normal"
                            className="text-gray-600"
                        >
                            No positions found
                        </BodyText>
                    </div>
                )}
            </div>
        </motion.section>
    )
}
