"use client"

import ImageWithDefault from '@/components/ImageWithDefault'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useSearchParams } from 'next/navigation'
import React, { useContext } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { abbreviateNumber, capitalizeText, convertScientificToNormal, getLiquidationRisk, getLowestDisplayValue, getRiskFactor, hasLowestDisplayValuePrefix, isLowestValue } from '@/lib/utils'
import { AssetsDataContext } from '@/context/data-provider'
import AvatarCircles from '@/components/ui/avatar-circles'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { PAIR_BASED_PROTOCOLS } from '@/constants'
import { Skeleton } from '@/components/ui/skeleton'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import Image from 'next/image'

export default function PositionDetails() {
    const searchParams = useSearchParams();
    const { allChainsData } = useContext(AssetsDataContext);
    // const tokenAddress = searchParams.get("token") || "";
    const chain_id = searchParams.get("chain_id") || 0;
    const protocol_identifier = searchParams.get("protocol_identifier") || "";
    const { address: walletAddress, isConnecting, isDisconnected } = useAccount();

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData
    } = useGetPortfolioData({
        user_address: walletAddress,
        protocol_identifier: [protocol_identifier],
        chain_id: [String(chain_id)],
    });

    // console.log(portfolioData);

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    });

    const isLoading = isLoadingPortfolioData || isLoadingPlatformData || isConnecting;

    const PLATFORMS_WITH_POSITIONS = portfolioData?.platforms.filter(platform => platform.positions.length > 0)
    console.log(PLATFORMS_WITH_POSITIONS);
    const [POSITIONS] = PLATFORMS_WITH_POSITIONS?.map((platform, index: number) => {
        const lendPositions = platform.positions.filter(position => position.type === "lend");
        const borrowPositions = platform.positions.filter(position => position.type === "borrow");
        const chainDetails = allChainsData.find(chain => chain.chain_id === platform.chain_id);

        function getSanitizedValue(value: number) {
            const normalValue = Number(convertScientificToNormal(value));
            return isLowestValue(normalValue) ? normalValue.toFixed(20) : normalValue;
        }

        const lendAmount = getSanitizedValue(platform?.total_liquidity)
        const borrowAmount = getSanitizedValue(platform?.total_borrow)

        return {
            lendAsset: {
                tokenImages: lendPositions.map(position => position.token.logo),
                tokenDetails: lendPositions.map(position => ({
                    logo: position.token.logo,
                    symbol: position.token.symbol,
                    amount: getSanitizedValue(position.amount * position.token.price_usd),
                    liquidation_threshold: position.liquidation_threshold,
                })),
                amount: lendAmount,
            },
            borrowAsset: {
                tokenImages: borrowPositions.map(position => position.token.logo),
                tokenDetails: borrowPositions.map(position => ({
                    logo: position.token.logo,
                    symbol: position.token.symbol,
                    amount: getSanitizedValue(position.amount * position.token.price_usd),
                })),
                amount: borrowAmount,
            },
            positionOn: {
                platformName: capitalizeText(platform?.platform_name.split("-").join(" ")),
                platformImage: platform?.logo ?? "",
                chainName: chainDetails?.name ?? "",
                chainImage: chainDetails?.logo ?? "",
            },
            riskFactor: getRiskFactor(platform.health_factor),
        }
    })

    const liquidationPrice = Number(POSITIONS?.lendAsset?.amount) * Number(POSITIONS?.lendAsset?.tokenDetails[0].liquidation_threshold);
    const liquidationPercentage = calculatePercentage(Number(POSITIONS?.lendAsset?.amount), Number(liquidationPrice));
    const liquidationDetails = {
        liquidationPrice: liquidationPrice,
        assetLogo: POSITIONS?.lendAsset?.tokenDetails[0].logo,
        assetSymbol: POSITIONS?.lendAsset?.tokenDetails[0].symbol,
        percentage: liquidationPercentage,
        riskFactor: getLiquidationRisk(liquidationPercentage, 50, 80),
    }
    const isPairBasedProtocol = PAIR_BASED_PROTOCOLS.includes(platformData?.platform.platform_type);

    // If user is not connected, show connect wallet button
    if (!walletAddress) {
        return (
            <motion.div
                className='flex flex-col gap-6 items-center justify-center h-full bg-white bg-opacity-75 rounded-6 px-5 py-12'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
                <BodyText level='body1' className='text-center'>Please connect your wallet to view your positions.</BodyText>
                <ConnectWalletButton />
            </motion.div>
        )
    }

    // If user is connected, show position details
    return (
        <motion.section
            className={`bg-white bg-opacity-40 px-[16px] rounded-6 ${isPairBasedProtocol && PLATFORMS_WITH_POSITIONS.length > 0 ? "pt-[32px] pb-[16px]" : "py-[16px]"}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
            {isPairBasedProtocol && PLATFORMS_WITH_POSITIONS.length > 0 &&
                <div className="px-[16px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-[12px]">
                        <div className="flex items-center gap-[8px]">
                            <BodyText level='body2'>
                                Liquidation Risk
                            </BodyText>
                            <Badge variant={liquidationDetails.riskFactor.theme as "destructive" | "yellow" | "green"}>
                                {liquidationDetails.riskFactor.label} risk
                            </Badge>
                        </div>
                        <div className="flex items-center gap-[16px]">
                            <BodyText level='body2'>
                                Liquidation price
                            </BodyText>
                            <div className="flex items-center gap-[6px]">
                                <ImageWithDefault src={liquidationDetails.assetLogo} alt={liquidationDetails.assetSymbol} width={16} height={16} className='rounded-full max-w-[16px] max-h-[16px]' />
                                <BodyText level='body1' weight='medium'>${abbreviateNumber(liquidationDetails.liquidationPrice)}</BodyText>
                            </div>
                        </div>
                    </div>
                    <div className="progress-bar mb-[20px]">
                        <Progress value={liquidationDetails.percentage} variant={liquidationDetails.riskFactor.theme as "destructive" | "yellow" | "green"} />
                    </div>
                </div>
            }
            <div className="bg-white rounded-4 py-[32px] px-[22px] md:px-[44px]">
                {
                    isLoading && <Skeleton className='w-full h-[100px]' />
                }
                {
                    !isLoading && PLATFORMS_WITH_POSITIONS.length > 0 &&
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                            <BodyText level='body2'>Your Collateral</BodyText>
                            <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                <div className="flex items-center gap-[6px]">
                                    <AvatarCircles
                                        avatarUrls={POSITIONS?.lendAsset?.tokenImages ?? []}
                                        avatarDetails={POSITIONS?.lendAsset?.tokenDetails?.map(token => ({
                                            content: `${hasLowestDisplayValuePrefix(Number(token.amount))} $${getStatDisplayValue(token.amount, false)}`,
                                            title: token.symbol
                                        }))}
                                    />
                                    <HeadingText level='h3'>${abbreviateNumber(Number(POSITIONS?.lendAsset.amount ?? 0))}</HeadingText>
                                </div>
                                {/* <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                withdraw
                            </Button> */}
                            </div>
                        </div>
                        <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                            <BodyText level='body2'>Your Borrowing</BodyText>
                            <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                <div className="flex items-center gap-[6px]">
                                    <AvatarCircles
                                        avatarUrls={POSITIONS?.borrowAsset?.tokenImages ?? []}
                                        avatarDetails={POSITIONS?.borrowAsset?.tokenDetails?.map(token => ({
                                            content: `${hasLowestDisplayValuePrefix(Number(token.amount))} $${getStatDisplayValue(token.amount, false)}`,
                                            title: token.symbol
                                        }))}
                                    />
                                    <HeadingText level='h3'>${abbreviateNumber(Number(POSITIONS?.borrowAsset.amount ?? 0))}</HeadingText>
                                </div>
                                {/* <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                repay
                            </Button> */}
                            </div>
                        </div>
                    </div>
                }
                {
                    !isLoading && PLATFORMS_WITH_POSITIONS.length === 0 &&
                    <div className="flex flex-col gap-[12px] items-center justify-center h-full">
                        <Image src="/icons/notification-lines-removed.svg" alt="No positions found" width={24} height={24} />
                        <BodyText level='body1'>No positions found currently</BodyText>
                    </div>
                }
            </div>
        </motion.section>
    )
}

function getStatDisplayValue(value: string | number, hasPrefix: boolean = true) {
    return `${hasPrefix ? hasLowestDisplayValuePrefix(Number(value)) : ""}${getLowestDisplayValue(Number(value))}`;
}

function calculatePercentage(value: number, maxValue: number): number {
    return (value / maxValue) * 100;
}
