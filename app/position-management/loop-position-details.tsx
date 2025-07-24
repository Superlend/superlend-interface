'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, abbreviateNumber, getRiskFactor, getLiquidationRisk, convertScientificToNormal, isLowestValue, getLowestDisplayValue, hasLowestDisplayValuePrefix, formatTokenAmount } from '@/lib/utils'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import AvatarCircles from '@/components/ui/avatar-circles'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import { AlertTriangle } from 'lucide-react'
import WithdrawAndRepayActionButton from './withdraw-and-repay'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { useSearchParams } from 'next/navigation'

interface LoopPositionDetailsProps {
    loopData: any
    isLoading: boolean
}

export default function LoopPositionDetails({ loopData, isLoading }: LoopPositionDetailsProps) {
    const { 
        hasAppleFarmRewards, 
        appleFarmRewardsAprs, 
        isLoading: isLoadingAppleFarmRewards 
    } = useAppleFarmRewards()
    const searchParams = useSearchParams()
    const chain_id = searchParams?.get('chain_id') || '1'
    const protocol_identifier = searchParams?.get('protocol_identifier') || ''
    
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
            console.log(`Found opportunity APY for ${opportunity.token.symbol} in position details:`, {
                tokenAddress: opportunity.token.address,
                currentAPY: opportunity.platform.apy.current,
                tokenSymbol: opportunity.token.symbol
            })
        }
        
        return opportunity ? parseFloat(opportunity.platform.apy.current) : null
    }

    if (isLoading || isLoadingAppleFarmRewards) {
        return (
            <div className="flex flex-col gap-6">
                <Card className="bg-white bg-opacity-40">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-6 w-40" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-3">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Enhanced supply APY calculation with opportunity data (includes Midas API updates)
    const opportunityAPY = findOpportunityAPY(loopData.collateralAsset.token.address)
    const baseSupplyAPY = opportunityAPY !== null ? opportunityAPY : (loopData.collateralAsset.baseApy || loopData.collateralAsset.apy || 0)
    const appleFarmRewardAPY = appleFarmRewardsAprs?.[loopData.collateralAsset.token.address] ?? 0
    
    // If baseApy exists, it means we have an active position and need to add apple farm rewards
    // If baseApy doesn't exist, the apy already includes apple farm rewards (no position case)
    // But if we have opportunity APY (Midas API data), use that as base and add apple farm rewards
    const enhancedSupplyAPY = (opportunityAPY !== null || loopData.collateralAsset.baseApy) 
        ? (baseSupplyAPY + appleFarmRewardAPY)
        : loopData.collateralAsset.apy 

    // console.log('Position Details APY calculation:', {
    //     tokenSymbol: loopData.collateralAsset.token.symbol,
    //     tokenAddress: loopData.collateralAsset.token.address,
    //     opportunityAPY,
    //     baseSupplyAPY,
    //     // appleFarmRewardAPY,
    //     enhancedSupplyAPY,
    //     originalApy: loopData.collateralAsset.apy,
    //     baseApy: loopData.collateralAsset.baseApy
    // })

    // Calculate risk metrics
    const liquidationPercentage = (loopData.positionLTV / loopData.liquidationLTV) * 100
    const riskFactor = getLiquidationRisk(liquidationPercentage, 50, 80)
    const healthFactorRisk = getRiskFactor(loopData.healthFactor)
    
    // Format liquidation price with proper scientific notation handling
    const formattedLiquidationPrice = (() => {
        const normalValue = Number(convertScientificToNormal(loopData.liquidationPrice))
        if (isLowestValue(normalValue)) {
            return `${hasLowestDisplayValuePrefix(normalValue)}$${getLowestDisplayValue(normalValue)}`
        }
        return `$${abbreviateNumber(normalValue)}`
    })()

    // Calculate liquidation price for lend token (collateral)
    const lendTokenLiquidationPrice = (() => {
        if (loopData.borrowAsset.amount <= 0 || loopData.collateralAsset.amount <= 0) return 0
        
        const borrowAmount = Number(convertScientificToNormal(loopData.borrowAsset.amount))
        const borrowPrice = loopData.borrowAsset.token.price_usd
        const lendAmount = Number(convertScientificToNormal(loopData.collateralAsset.amount))
        const liquidationThreshold = loopData.liquidationLTV / 100
        
        // Calculate at what price of lend token liquidation occurs
        return (borrowAmount * borrowPrice) / (lendAmount * liquidationThreshold)
    })()

    const formattedLendTokenLiquidationPrice = (() => {
        if (isLowestValue(lendTokenLiquidationPrice)) {
            return `${hasLowestDisplayValuePrefix(lendTokenLiquidationPrice)}$${getLowestDisplayValue(lendTokenLiquidationPrice)}`
        }
        return `$${abbreviateNumber(lendTokenLiquidationPrice)}`
    })()

    // Prepare token details for withdraw and repay buttons (similar to position-details.tsx)
    const collateralTokenDetails = [{
        address: loopData.collateralAsset.token.address,
        decimals: loopData.collateralAsset.token.decimals,
        logo: loopData.collateralAsset.token.logo,
        symbol: loopData.collateralAsset.token.symbol,
        amountInUSD: Number(convertScientificToNormal(loopData.collateralAsset.amountUSD)),
        liquidation_threshold: loopData.liquidationLTV, // Using liquidation LTV for collateral
        tokenAmount: Number(convertScientificToNormal(loopData.collateralAsset.amount)),
        apy: enhancedSupplyAPY,
        price_usd: loopData.collateralAsset.token.price_usd,
        positionTokenAmount: Number(convertScientificToNormal(loopData.collateralAsset.amount)),
        chain_name: loopData.collateralAsset.token.chain_name || ''
    }]

    const borrowTokenDetails = [{
        address: loopData.borrowAsset.token.address,
        decimals: loopData.borrowAsset.token.decimals,
        logo: loopData.borrowAsset.token.logo,
        symbol: loopData.borrowAsset.token.symbol,
        amountInUSD: Number(convertScientificToNormal(loopData.borrowAsset.amountUSD)),
        tokenAmount: Number(convertScientificToNormal(loopData.borrowAsset.amount)),
        apy: loopData.borrowAsset.apy,
        price_usd: loopData.borrowAsset.token.price_usd,
        positionTokenAmount: Number(convertScientificToNormal(loopData.borrowAsset.amount)),
        chain_name: loopData.borrowAsset.token.chain_name || ''
    }]

    return (
        <div className="flex flex-col gap-6">
            {/* Position Assets Overview */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                            Position Assets
                        </HeadingText>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Collateral Asset */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Collateral Supplied
                                    </BodyText>
                                    <InfoTooltip content="Total amount of assets you've supplied as collateral" />
                                </div>
                                
                                <div className="flex flex-col xs:flex-row gap-[12px] xs:items-center">
                                    <div className="flex items-center gap-2">
                                        <ImageWithDefault
                                            src={loopData.collateralAsset.token.logo}
                                            alt={loopData.collateralAsset.token.symbol}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                        <div className="flex flex-col">
                                            <HeadingText level="h4" weight="medium" className="text-gray-800">
                                                {(() => {
                                                    const normalAmount = Number(convertScientificToNormal(loopData.collateralAsset.amount))
                                                    return `${formatTokenAmount(normalAmount)} ${loopData.collateralAsset.token.symbol}`
                                                })()}
                                            </HeadingText>
                                            <BodyText level="body3" className="text-gray-600">
                                                {(() => {
                                                    const normalAmountUSD = Number(convertScientificToNormal(loopData.collateralAsset.amountUSD))
                                                    if (isLowestValue(normalAmountUSD)) {
                                                        return `${hasLowestDisplayValuePrefix(normalAmountUSD)}$${getLowestDisplayValue(normalAmountUSD)}`
                                                    }
                                                    return `$${abbreviateNumber(normalAmountUSD)}`
                                                })()}
                                            </BodyText>
                                        </div>
                                    </div>
                                    <WithdrawAndRepayActionButton
                                        actionType="withdraw"
                                        tokenDetails={collateralTokenDetails}
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-4">
                                    <BodyText level="body3" className="text-green-700">
                                        Supply APY
                                    </BodyText>
                                    <BodyText level="body3" weight="medium" className="text-green-700">
                                        {enhancedSupplyAPY.toFixed(2)}%
                                    </BodyText>
                                </div>
                            </div>

                            {/* Borrowed Asset */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Total Borrowed
                                    </BodyText>
                                    <InfoTooltip content="Total amount of assets you've borrowed against your collateral" />
                                </div>
                                
                                <div className="flex flex-col xs:flex-row gap-[12px] xs:items-center">
                                    <div className="flex items-center gap-2">
                                        <ImageWithDefault
                                            src={loopData.borrowAsset.token.logo}
                                            alt={loopData.borrowAsset.token.symbol}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                        <div className="flex flex-col">
                                            <HeadingText level="h4" weight="medium" className="text-gray-800">
                                                {(() => {
                                                    const normalAmount = Number(convertScientificToNormal(loopData.borrowAsset.amount))
                                                    return `${formatTokenAmount(normalAmount)} ${loopData.borrowAsset.token.symbol}`
                                                })()}
                                            </HeadingText>
                                            <BodyText level="body3" className="text-gray-600">
                                                {(() => {
                                                    const normalAmountUSD = Number(convertScientificToNormal(loopData.borrowAsset.amountUSD))
                                                    if (isLowestValue(normalAmountUSD)) {
                                                        return `${hasLowestDisplayValuePrefix(normalAmountUSD)}$${getLowestDisplayValue(normalAmountUSD)}`
                                                    }
                                                    return `$${abbreviateNumber(normalAmountUSD)}`
                                                })()}
                                            </BodyText>
                                        </div>
                                    </div>
                                    <WithdrawAndRepayActionButton
                                        actionType="repay"
                                        tokenDetails={borrowTokenDetails}
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-4">
                                    <BodyText level="body3" className="text-red-700">
                                        Borrow APY
                                    </BodyText>
                                    <BodyText level="body3" weight="medium" className="text-red-700">
                                        {loopData.borrowAsset.apy.toFixed(2)}%
                                    </BodyText>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

           

            {/* Risk Metrics */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <HeadingText level="h5" weight="medium" className="text-gray-800">
                                Risk Analysis
                            </HeadingText>
                            <Badge
                                variant={healthFactorRisk.theme as 'destructive' | 'yellow' | 'green'}
                            >
                                {healthFactorRisk.label} Risk
                            </Badge>
                        </div>

                        {/* Health Factor */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Health Factor
                                    </BodyText>
                                    <InfoTooltip content="A numeric representation of position safety. Below 1.0 triggers liquidation." />
                                </div>
                                <InfoTooltip
                                    content="This health factor is calculated based on all your positions on the platform, not just this specific token pair"
                                    label={
                                        <HeadingText 
                                            level="h4" 
                                            weight="medium" 
                                            className={cn(
                                                "cursor-pointer",
                                                loopData.healthFactor < 1.2
                                                    ? 'text-red-600'
                                                    : loopData.healthFactor < 1.5
                                                        ? 'text-yellow-600'
                                                        : 'text-green-600'
                                            )}
                                        >
                                            {loopData.healthFactor}
                                        </HeadingText>
                                    }
                                />
                            </div>
                            <BodyText level="body3" className="text-gray-600">
                                Liquidation occurs when health factor drops below 1.0
                            </BodyText>
                        </div>

                        {/* Liquidation Price */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BodyText level="body2" weight="medium" className="text-gray-600">
                                    Liquidation Prices
                                </BodyText>
                                <InfoTooltip content={`Prices at which your position would be liquidated${loopData.hasMultiplePositions ? '. Note: This calculation considers all your positions on the platform due to cross-collateralization.' : ''}`} />
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Borrow Token Liquidation Price */}
                                <InfoTooltip
                                    content={`If ${loopData.borrowAsset.token.symbol} price rises to ${formattedLiquidationPrice}, your position will be liquidated`}
                                    label={
                                        <div className="flex items-center gap-1 cursor-pointer">
                                            <ImageWithDefault
                                                src={loopData.borrowAsset.token.logo}
                                                alt={loopData.borrowAsset.token.symbol}
                                                width={14}
                                                height={14}
                                                className="rounded-full"
                                            />
                                            <BodyText level="body3" weight="medium" className="text-red-600">
                                                {formattedLiquidationPrice}
                                            </BodyText>
                                        </div>
                                    }
                                />

                                {/* Separator */}
                                <BodyText level="body3" className="text-gray-400">
                                    |
                                </BodyText>

                                {/* Lend Token Liquidation Price */}
                                <InfoTooltip
                                    content={`If ${loopData.collateralAsset.token.symbol} price falls to ${formattedLendTokenLiquidationPrice}, your position will be liquidated`}
                                    label={
                                        <div className="flex items-center gap-1 cursor-pointer">
                                            <ImageWithDefault
                                                src={loopData.collateralAsset.token.logo}
                                                alt={loopData.collateralAsset.token.symbol}
                                                width={14}
                                                height={14}
                                                className="rounded-full"
                                            />
                                            <BodyText level="body3" weight="medium" className="text-red-600">
                                                {formattedLendTokenLiquidationPrice}
                                            </BodyText>
                                        </div>
                                    }
                                />
                            </div>
                        </div>

                        {/* LTV Progress */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <BodyText level="body2" weight="medium" className="text-gray-600">
                                    Loan-to-Value Ratio
                                </BodyText>
                                <BodyText level="body2" weight="medium" className="text-gray-800">
                                    {loopData.positionLTV}% / {loopData.liquidationLTV}%
                                </BodyText>
                            </div>
                            <Progress
                                value={liquidationPercentage}
                                variant={
                                    riskFactor.theme as 'destructive' | 'yellow' | 'green'
                                }
                            />
                            <BodyText level="body3" className="text-gray-600">
                                Using {liquidationPercentage.toFixed(1)}% of available borrowing capacity
                            </BodyText>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {/* Multiple Positions Warning */}
             {loopData.hasMultiplePositions && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-2">
                                <HeadingText level="h5" weight="medium" className="text-orange-800">
                                    Multiple Positions Detected
                                </HeadingText>
                                <BodyText level="body2" className="text-orange-700">
                                    You have multiple positions on this platform beyond the selected token pair. 
                                    The leverage and liquidation calculations shown may be approximate due to 
                                    cross-collateralization. This is a pool-based lending protocol, not pair-based, 
                                    so all your positions contribute to your overall health factor and borrowing capacity.
                                </BodyText>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leverage Details */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                        <HeadingText level="h5" weight="medium" className="text-gray-800">
                            Leverage Information
                        </HeadingText>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Current Leverage
                                    </BodyText>
                                    <InfoTooltip content={`Your current leverage multiplier for this position${loopData.hasMultiplePositions ? '. This calculation may be approximate due to multiple positions on the platform.' : ''}`} />
                                </div>
                                <HeadingText level="h4" weight="medium" className="text-primary">
                                    {loopData.currentLeverage}x
                                </HeadingText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <BodyText level="body2" weight="medium" className="text-gray-600">
                                    Max Leverage
                                </BodyText>
                                <HeadingText level="h4" weight="medium" className="text-gray-800">
                                    {Number(loopData.maxLeverage).toFixed(2)}x
                                </HeadingText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <BodyText level="body2" weight="medium" className="text-gray-600">
                                    Utilization Rate
                                </BodyText>
                                <HeadingText level="h4" weight="medium" className="text-gray-800">
                                    {loopData.utilizationRate.toFixed(1)}%
                                </HeadingText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <BodyText level="body2" weight="medium" className="text-gray-600">
                                        Platform
                                    </BodyText>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ImageWithDefault
                                        src={loopData.platform.logo}
                                        alt={loopData.platform.name}
                                        width={20}
                                        height={20}
                                    />
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        {loopData.platform.name}
                                    </BodyText>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 