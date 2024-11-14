"use client"

import ImageWithDefault from '@/components/ImageWithDefault'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BodyText, HeadingText } from '@/components/ui/typography'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useSearchParams } from 'next/navigation'
import React, { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { abbreviateNumber, capitalizeText, convertScientificToNormal, getLiquidationRisk, getLowestDisplayValue, getRiskFactor, hasLowestDisplayValuePrefix, isLowestValue } from '@/lib/utils'
import { AssetsDataContext } from '@/context/data-provider'
import AvatarCircles from '@/components/ui/avatar-circles'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { PAIR_BASED_PROTOCOLS } from '@/constants'
import { Skeleton } from '@/components/ui/skeleton'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import Image from 'next/image'
import { useActiveAccount, useConnect } from 'thirdweb/react'
import TooltipText from '@/components/tooltips/TooltipText'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { TPlatform } from '@/types'

type TRow = {
    id: number;
    key: "lend" | "borrow" | "duration";
    title: string;
    logo?: string;
    selectedLabel: string;
    selectedValue: number;
    totalValue: number;
    step: number;
}

export default function PositionDetails() {
    const searchParams = useSearchParams();
    const { allChainsData } = useContext(AssetsDataContext);
    // const tokenAddress = searchParams.get("token") || "";
    const chain_id = searchParams.get("chain_id") || 0;
    const protocol_identifier = searchParams.get("protocol_identifier") || "";
    // const { address: walletAddress, isConnecting, isDisconnected } = useAccount();
    const activeAccount = useActiveAccount();
    const walletAddress = activeAccount?.address;
    const { isConnecting } = useConnect();

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        protocol_identifier: [protocol_identifier],
        chain_id: [String(chain_id)],
    });


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

    // Filter user positions
    const userPositions = portfolioData?.platforms.filter(platform =>
        platform?.protocol_identifier.toLowerCase() === (platformData?.platform as any)?.protocol_identifier.toLowerCase()
    );

    // Format user positions
    const [formattedUserPositions] = userPositions?.map((platform, index: number) => {
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
                    tokenAmount: position.amount,
                })),
                amount: lendAmount,
            },
            borrowAsset: {
                tokenImages: borrowPositions.map(position => position.token.logo),
                tokenDetails: borrowPositions.map(position => ({
                    logo: position.token.logo,
                    symbol: position.token.symbol,
                    amount: getSanitizedValue(position.amount * position.token.price_usd),
                    tokenAmount: position.amount,
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

    const numerator = Number(formattedUserPositions?.borrowAsset?.tokenDetails[0]?.amount) || 0;
    const denominator = (Number(formattedUserPositions?.lendAsset?.tokenDetails[0]?.liquidation_threshold)) / 100;
    const tokenAmount = Number(formattedUserPositions?.lendAsset?.tokenDetails[0]?.tokenAmount);

    const liquidationPrice = numerator / (denominator * tokenAmount);

    const liquidationPercentage = (Number(formattedUserPositions?.borrowAsset?.tokenDetails[0]?.amount) * 100) / (Number(formattedUserPositions?.lendAsset?.tokenDetails[0]?.amount) * denominator);
    const liquidationDetails = {
        liquidationPrice: liquidationPrice,
        assetLogo: formattedUserPositions?.lendAsset?.tokenDetails[0]?.logo,
        assetSymbol: formattedUserPositions?.lendAsset?.tokenDetails[0]?.symbol,
        percentage: liquidationPercentage,
        riskFactor: getLiquidationRisk(liquidationPercentage, 50, 80),
    }
    const isPairBasedProtocol = PAIR_BASED_PROTOCOLS.includes(platformData?.platform.platform_type);

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full h-[150px] rounded-6 overflow-hidden">
                <Skeleton className='w-full h-full' />
            </div>
        )
    }

    // If user is not connected, show connect wallet button
    if (!isLoading && !walletAddress) {
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

    // If user is connected, but does not have any positions, show estimated returns
    if (!isLoading && userPositions.length === 0) {
        return (
            <EsimatedReturns
                platformDetails={platformData}
            />
        )
    }

    // If user is connected, and has positions, show position details
    return (
        <motion.section
            className={`bg-white bg-opacity-40 px-[16px] rounded-6 ${isPairBasedProtocol && userPositions.length > 0 ? "pt-[32px] pb-[16px]" : "py-[16px]"}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
            {isPairBasedProtocol && userPositions.length > 0 &&
                <div className="px-[16px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-[12px]">
                        <div className="flex items-center gap-[8px]">
                            <BodyText level='body2' className='capitalize'>
                                Liquidation Risk
                            </BodyText>
                            {/* If numerator is greater than 0, show the risk factor badge */}
                            {
                                numerator > 0 &&
                                <Badge variant={liquidationDetails.riskFactor.theme as "destructive" | "yellow" | "green"}>
                                    {liquidationDetails.riskFactor.label} risk
                                </Badge>
                            }
                            {/* If numerator is 0, show the "No liquidation risk" badge */}
                            {
                                numerator === 0 &&
                                <Badge variant="default">
                                    N/A
                                </Badge>
                            }
                        </div>
                        <div className="flex items-center gap-[16px]">
                            <BodyText level='body2' className='capitalize'>
                                Liquidation price
                            </BodyText>
                            <div className="flex items-center gap-[6px]">
                                <ImageWithDefault src={liquidationDetails.assetLogo} alt={liquidationDetails.assetSymbol} width={16} height={16} className='rounded-full max-w-[16px] max-h-[16px]' />
                                {
                                    numerator > 0 &&
                                    <BodyText level='body1' weight='medium'>${abbreviateNumber(liquidationDetails.liquidationPrice)}</BodyText>
                                }
                                {
                                    numerator === 0 &&
                                    <BodyText level='body1' weight='normal'>
                                        <InfoTooltip
                                            label={
                                                <TooltipText className='text-gray-600'>
                                                    N/A
                                                </TooltipText>
                                            }
                                            content="You do not have any borrows in this vault"
                                        />
                                    </BodyText>
                                }
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
                    !isLoading && userPositions.length > 0 &&
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                            <BodyText level='body2' weight='normal' className="text-gray-600">Your Collateral</BodyText>
                            <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                <div className="flex items-center gap-[6px]">
                                    <AvatarCircles
                                        avatarUrls={formattedUserPositions?.lendAsset?.tokenImages ?? []}
                                        avatarDetails={formattedUserPositions?.lendAsset?.tokenDetails?.map(token => ({
                                            content: `${hasLowestDisplayValuePrefix(Number(token.amount))} $${getStatDisplayValue(token.amount, false)}`,
                                            title: token.symbol
                                        }))}
                                    />
                                    <HeadingText level='h3' weight='medium' className="text-gray-800">${abbreviateNumber(Number(formattedUserPositions?.lendAsset.amount ?? 0))}</HeadingText>
                                </div>
                                {/* <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                withdraw
                            </Button> */}
                            </div>
                        </div>
                        <div className="flex flex-col gap-[12px] md:max-w-[230px] w-full">
                            <BodyText level='body2' weight='normal' className="text-gray-600">Your Borrowing</BodyText>
                            <div className="flex flex-col md:flex-row gap-[12px] md:items-center justify-between">
                                <div className="flex items-center gap-[6px]">
                                    <AvatarCircles
                                        avatarUrls={formattedUserPositions?.borrowAsset?.tokenImages ?? []}
                                        avatarDetails={formattedUserPositions?.borrowAsset?.tokenDetails?.map(token => ({
                                            content: `${hasLowestDisplayValuePrefix(Number(token.amount))} $${getStatDisplayValue(token.amount, false)}`,
                                            title: token.symbol
                                        }))}
                                    />
                                    <HeadingText level='h3' weight='medium' className="text-gray-800">${abbreviateNumber(Number(formattedUserPositions?.borrowAsset.amount ?? 0))}</HeadingText>
                                </div>
                                {/* <Button disabled variant={'secondaryOutline'} className='uppercase max-w-[100px] w-full'>
                                repay
                            </Button> */}
                            </div>
                        </div>
                    </div>
                }
                {
                    !isLoading && userPositions.length === 0 &&
                    <div className="flex flex-col gap-[12px] items-center justify-center h-full">
                        <Image src="/icons/notification-lines-removed.svg" alt="No positions found" width={24} height={24} />
                        <BodyText level='body1' weight='normal' className="text-gray-600">No positions found</BodyText>
                    </div>
                }
            </div>
        </motion.section>
    )
}

// Child components
function EsimatedReturns({
    platformDetails
}: {
    platformDetails: TPlatform;
}) {
    const [selectedValue, setSelectedValue] = useState({
        lend: 0,
        borrow: 0,
        duration: 0,
    });

    const lendAssetDetails = platformDetails?.assets.filter(asset => !asset.borrow_enabled)[0];
    const borrowAssetDetails = platformDetails?.assets.filter(asset => asset.borrow_enabled)[0];

    const supplyAPY = lendAssetDetails?.supply_apy;
    const borrowAPY = borrowAssetDetails?.variable_borrow_apy;
    const amountSupplied = selectedValue.lend;
    const amountBorrowed = selectedValue.borrow;
    const supplyTokenPrice = supplyAPY * lendAssetDetails?.token?.price_usd;
    const borrowTokenPrice = borrowAPY * borrowAssetDetails?.token?.price_usd;
    const duration = selectedValue.duration;

    const handleSelectedValueChange = (value: number, type: "lend" | "borrow" | "duration") => {
        setSelectedValue(prev => ({ ...prev, [type]: value }));
    }

    const rows: TRow[] = [
        {
            id: 1,
            key: "lend",
            title: "lend collateral",
            logo: lendAssetDetails?.token.logo,
            selectedLabel: lendAssetDetails?.token.symbol,
            selectedValue: selectedValue.lend,
            totalValue: 50,
            step: 1,
        },
        {
            id: 2,
            key: "borrow",
            title: "borrowing",
            logo: borrowAssetDetails?.token.logo,
            selectedLabel: borrowAssetDetails?.token.symbol,
            selectedValue: selectedValue.borrow,
            totalValue: 50,
            step: 1,
        },
        {
            id: 3,
            key: "duration",
            title: "Duration",
            selectedLabel: "years",
            selectedValue: selectedValue.duration,
            totalValue: 5,
            step: 0.5,
        }
    ];

    const estimatedEarnings = getEstimatedEarnings({
        supplyAPY,
        borrowAPY,
        amountSupplied,
        amountBorrowed,
        supplyTokenPrice,
        borrowTokenPrice,
        duration,
    });

    return (
        <Card>
            <CardHeader className='pb-[12px]'>
                <div className="flex justify-between items-center gap-[12px]">
                    <BodyText level='body2' weight='normal' className="text-gray-600">
                        Estimate returns by using slider below
                    </BodyText>
                    <div className="flex items-center gap-[8px]">
                        <BodyText level='body2' weight='normal' className="text-gray-600">
                            Your earnings
                        </BodyText>
                        <HeadingText level='h4' weight='medium' className="text-gray-800">
                            ${abbreviateNumber(estimatedEarnings)}
                        </HeadingText>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='bg-white rounded-5 px-[32px] py-[28px]'>
                <div className="flex flex-col gap-[16px]">
                    {
                        rows.map(row => (
                            <div key={row.id} className="flex flex-col gap-[16px]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-[8px]">
                                        <BodyText level='body2' weight='normal' className="capitalize text-gray-600">
                                            {row.title} -
                                        </BodyText>
                                        <div className="flex items-center gap-[6px]">
                                            {row.logo && <ImageWithDefault src={row.logo} alt={row.selectedLabel} width={20} height={20} className='rounded-full max-w-[20px] max-h-[20px]' />}
                                            <HeadingText level='h4' weight='medium' className="text-gray-800">
                                                {row.selectedValue} {row.selectedLabel}
                                            </HeadingText>
                                        </div>
                                    </div>
                                    <BodyText level='body1' weight='normal' className="text-gray-600">
                                        {row.totalValue}
                                    </BodyText>
                                </div>
                                <Slider defaultValue={[row.selectedValue]} max={row.totalValue} step={row.step} onValueChange={(value) => handleSelectedValueChange(value[0], row.key)} />
                            </div>
                        ))
                    }
                </div>
            </CardContent>
        </Card>

    )
}

// Helper functions
function getStatDisplayValue(value: string | number, hasPrefix: boolean = true) {
    return `${hasPrefix ? hasLowestDisplayValuePrefix(Number(value)) : ""}${getLowestDisplayValue(Number(value))}`;
}

// Function to calculate estimated earnings
/**
 * @param lendCollateral - Amount of collateral supplied
 * @param borrowing - Amount of borrowing
 * @param duration - Duration of investment
 * @returns - Estimated earnings
 */

/** Calculation logic - 
Supply APY: 
𝑅𝑠 (as a decimal, e.g., 0.05 for 5%)

Borrow APY: 
𝑅𝑏 (as a decimal, e.g., 0.04 for 4%)

Amount supplied: 𝐴𝑠
Amount borrowed: 𝐴𝑏

supply token price: Price(S)
borrow token price: Price(B)

Duration of investment: 𝑇
T (in years; for shorter periods, express as a fraction, e.g., 0.5 for 6 months)

Net Returns = T×(As × Rs x Price(S) ​− Ab ​× Rb x Price(B))
*/
function getEstimatedEarnings({
    supplyAPY,
    borrowAPY,
    amountSupplied,
    amountBorrowed,
    supplyTokenPrice,
    borrowTokenPrice,
    duration,
}: {
    supplyAPY: number;
    borrowAPY: number;
    amountSupplied: number;
    amountBorrowed: number;
    supplyTokenPrice: number;
    borrowTokenPrice: number;
    duration: number;
}) {
    return duration * (amountSupplied * supplyAPY * supplyTokenPrice - amountBorrowed * borrowAPY * borrowTokenPrice);
}
