'use client'

import ExternalLink from '@/components/ExternalLink'
import ImageWithBadge from '@/components/ImageWithBadge'
import ImageWithDefault from '@/components/ImageWithDefault'
import StackedIcons from '@/components/StackedIcons'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import AvatarCircles from '@/components/ui/avatar-circles'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BodyText, Label } from '@/components/ui/typography'
import { PAIR_BASED_PROTOCOLS } from '@/constants'
import { useAssetsDataContext } from '@/context/data-provider'
import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'
import useDimensions from '@/hooks/useDimensions'
import {
    abbreviateNumber,
    capitalizeText,
    containsNegativeInteger,
    // convertAPRtoAPY,
    convertNegativeToPositive,
    getPlatformVersion,
} from '@/lib/utils'
import { TOpportunityTable, TReward } from '@/types'
import { ChainId } from '@/types/chain'
import { PlatformType } from '@/types/platform'
import { TLoopPair } from '@/utils/createLoopPairs'
import { ColumnDef } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { ChartNoAxesColumnIncreasing, Percent, ShieldAlertIcon, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: 'tokenSymbol',
        header: () => "Strategy",
        accessorFn: (item) => item.tokenSymbol,
        cell: ({ row }) => {
            const searchParams = useSearchParams()
            const isMorphoShiftToken =
                row.original.tokenAddress ===
                '0x7751E2F4b8ae93EF6B79d86419d42FE3295A4559'
            const positionTypeParam =
                searchParams?.get('position_type') || 'lend'
            const tokenSymbol: string = row.getValue('tokenSymbol')
            const tokenLogo = row.original.tokenLogo
            const tokenAddress = row.original.tokenAddress
            const tokenName = row.original.tokenName
            const chainId = row.original.chain_id
            const chainLogo = row.original.chainLogo
            const chainName = row.original.chainName
            const protocolIdentifier = row.original.protocol_identifier
            const borrowToken = (row.original as TLoopPair).borrowToken

            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Lend Token</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault
                                alt={`${tokenSymbol} token logo`}
                                src={tokenLogo || ''}
                                width={24}
                                height={24}
                                className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                            />
                            <BodyText level="body2" weight="medium">
                                {tokenName}
                            </BodyText>
                        </span>
                    </span>
                    <span className="flex flex-col gap-[4px]">
                        <Label>Borrow Token</Label>
                        <span className="flex items-center gap-[8px] w-fit max-w-full">
                            <ImageWithDefault
                                src={borrowToken.logo || ''}
                                alt={`${borrowToken.symbol} token logo`}
                                width={20}
                                height={20}
                                className="rounded-full max-w-[20px] max-h-[20px]"
                            />
                            <BodyText
                                level={'body2'}
                                weight={'medium'}
                                className="truncate"
                            >
                                {borrowToken.symbol}
                            </BodyText>
                        </span>
                    </span>
                    <span className="flex flex-col gap-[4px]">
                        <Label>Chain</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault
                                alt={`${chainName} chain logo`}
                                src={chainLogo || ''}
                                width={24}
                                height={24}
                                className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                            />
                            <BodyText level="body2" weight="medium">
                                {chainName[0]}
                                {chainName.toLowerCase().slice(1)}
                            </BodyText>
                        </span>
                    </span>
                </span>
            )

            return (
                <span className="flex items-center gap-[8px] w-fit max-w-full">
                    <InfoTooltip
                        label={
                            <StackedIcons
                                list={[
                                    {
                                        id: 'lend_token',
                                        src: tokenLogo || '',
                                        alt: `${tokenSymbol} token logo`,
                                        width: '24',
                                        height: '24',
                                    },
                                    {
                                        id: 'borrow_token',
                                        src: borrowToken.logo || '',
                                        alt: `${borrowToken.symbol} token logo`,
                                        width: '24',
                                        height: '24',
                                    }
                                ]}
                            />
                        }
                        content={tooltipContent}
                    />
                    <Link
                        href={{
                            pathname: 'position-management',
                            query: {
                                token: tokenAddress,
                                chain_id: chainId,
                                protocol_identifier: protocolIdentifier,
                                position_type: positionTypeParam,
                            },
                        }}
                        className="flex items-center gap-1 w-fit truncate"
                    >
                        <BodyText
                            level={'body2'}
                            weight={'medium'}
                            className="truncate block shrink-0 hover:text-secondary-500 active:text-secondary-500 w-fit max-w-full"
                        >
                            {tokenSymbol}
                        </BodyText>
                        <BodyText
                            level="body1"
                            weight="medium"
                            className="text-gray-500"
                        >
                            /
                        </BodyText>
                        <BodyText
                            level={'body2'}
                            weight={'medium'}
                            className="truncate block shrink-0 hover:text-secondary-500 active:text-secondary-500 w-fit max-w-full"
                        >
                            {borrowToken.symbol}
                        </BodyText>
                    </Link>
                    {isMorphoShiftToken && positionTypeParam === 'lend' && (
                        <InfoTooltip
                            label={
                                <ImageWithDefault
                                    src="/icons/sparkles.svg"
                                    alt="Rewards"
                                    width={22}
                                    height={22}
                                    className="cursor-pointer hover:scale-110"
                                />
                            }
                            content="Supplying to this vault earns up to 25% APY in SHIFT rewards"
                        />
                    )}
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'platformName',
        header: 'Platform',
        accessorFn: (item) =>
            `${item.platformName} ${item.platformWithMarketName}`,
        cell: ({ row }) => {
            const platformName: string = row.getValue('platformName')
            const platformId: string = row.original.platformId
            const isMorpho =
                row.original.platformId.split('-')[0].toLowerCase() ===
                PlatformType.MORPHO
            const isVault = row.original.isVault
            const platformWithMarketName: string =
                row.original.platformWithMarketName
            const formattedPlatformWithMarketName: string = (isMorpho && isVault && row.original.chainName.toLowerCase() === 'polygon')
                ? "Compound Morpho Vaults"
                : (platformWithMarketName.includes("/") && !platformWithMarketName.split(' ')[0].toLowerCase().includes(platformId.split('-')[0].toLowerCase()))
                    ? platformWithMarketName
                    : platformWithMarketName.split(' ').slice(1).join(' ')
            const platformLogo = row.original.platformLogo
            const searchParams = useSearchParams()
            const positionTypeParam =
                searchParams?.get('position_type') || 'lend'
            // const morphoLabel =
            //     isMorpho && isVault ? 'Morpho Vaults' : 'Morpho Markets'
            // const formattedPlatformName = isMorpho ? morphoLabel : platformName
            const platformDisplayName = `${capitalizeText(platformName.split(' ')[0])} ${getPlatformVersion(platformId)}`
            const showPlatformCuratorName =
                platformDisplayName.split(' ')[1].toLowerCase() !==
                formattedPlatformWithMarketName.toLowerCase()

            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        src={platformLogo || ''}
                        alt={`${platformName} logo`}
                        width={20}
                        height={20}
                    />
                    <div className="flex flex-col gap-[0px] truncate">
                        <BodyText
                            level={'body2'}
                            weight={'medium'}
                            className="truncate leading-0"
                        >
                            {platformDisplayName}
                        </BodyText>
                        {showPlatformCuratorName && (
                            <Label title={formattedPlatformWithMarketName} className="text-gray-800 inline-block leading-0 truncate">
                                {formattedPlatformWithMarketName}
                            </Label>
                        )}
                    </div>
                    {isMorpho && !isVault && positionTypeParam === 'lend' && (
                        <InfoTooltip content="Supplying directly to Morpho markets is risky and not advised by the Morpho team" />
                    )}
                </span>
            )
        },
        enableSorting: false,
        // enableGlobalFilter: false,
    },
    {
        accessorKey: 'maxAPY',
        accessorFn: (item) => {
            // Check if this is a loop pair (has maxAPY field)
            const loopPair = item as TLoopPair
            if (loopPair.maxAPY !== undefined) {
                return Number(loopPair.maxAPY)
            }
            // Fallback to regular APY calculation for non-loop pairs
            return Number(item.apy_current) + (item.has_apple_farm_rewards ? Number(item.apple_farm_apr) : 0)
        },
        header: () => {
            const searchParams = useSearchParams()
            const positionTypeParam = searchParams?.get('position_type') || 'lend'
            
            // Check if we're showing loop pairs
            const isLoopType = positionTypeParam === 'loop'
            const headerText = isLoopType ? 'Max APY' : 'APY'
            
            const lendTooltipContent = '% interest you earn on deposits over a year. This includes compounding.'
            const borrowTooltipContent = '% interest you pay for your borrows over a year. This includes compunding.'
            const loopTooltipContent = 'Maximum APY achievable with leveraged loop position at maximum leverage.'
            
            let tooltipContent = lendTooltipContent
            if (positionTypeParam === 'borrow') {
                tooltipContent = borrowTooltipContent
            } else if (isLoopType) {
                tooltipContent = loopTooltipContent
            }

            return (
                <InfoTooltip
                    side="bottom"
                    label={<TooltipText>{headerText}</TooltipText>}
                    content={tooltipContent}
                />
            )
        },
        cell: ({ row }) => {
            const loopPair = row.original as TLoopPair
            const maxAPY = loopPair.strategy?.max_apy.current || 0
            const maxAPYFormatted = (Math.abs(maxAPY) > 0 && Math.abs(maxAPY) < 0.01) ? '<0.01' : abbreviateNumber(maxAPY)
            
            // Get strategy breakdown for tooltip
            const strategyBreakdown = loopPair.strategy?.breakdown || []
            const hasBreakdown = strategyBreakdown.length > 0

            return (
                <span className="flex items-center gap-1">
                    <BodyText 
                        level={'body2'} 
                        weight={'medium'}
                        className={maxAPY > 0 ? 'text-green-600' : 'text-red-600'}
                    >
                        {maxAPY >= 0 ? '' : '-'}{`${Math.abs(Number(maxAPYFormatted))}%`}
                    </BodyText>
                    {hasBreakdown && (
                        <InfoTooltip
                            label={
                                <span onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    {strategyBreakdown.some(item => 
                                        item.asset.symbol === 'APPL' || 
                                        item.asset.name.toLowerCase().includes('apple')
                                    ) ? (
                                        <ImageWithDefault
                                            src="/images/apple-farm-favicon.ico"
                                            alt="Apple Farm Rewards"
                                            width={22}
                                            height={22}
                                            className="cursor-pointer hover:scale-110"
                                        />
                                    ) : (
                                        <ImageWithDefault
                                            src="/icons/sparkles.svg"
                                            alt="Strategy Breakdown"
                                            width={22}
                                            height={22}
                                            className="cursor-pointer hover:scale-110"
                                        />
                                    )}
                                </span>
                            }
                            content={getStrategyBreakdownTooltip({
                                breakdown: strategyBreakdown,
                                maxAPY: maxAPY,
                            })}
                        />
                    )}
                </span>
            )
        },
        enableGlobalFilter: false,
    },
    {
        accessorKey: 'max_apy_7d',
        accessorFn: (item) => {
            const loopPair = item as TLoopPair
            return loopPair.strategy?.max_apy.avg_7days || 0
        },
        header: () => {
            return (
                <InfoTooltip
                    side="bottom"
                    label={<TooltipText>7D Max APY</TooltipText>}
                    content={'7-day average of maximum APY achievable with this loop strategy.'}
                />
            )
        },
        cell: ({ row }) => {
            const loopPair = row.original as TLoopPair
            const maxApy7d = loopPair.strategy?.max_apy.avg_7days || 0
            const maxApy7dFormatted = (Math.abs(maxApy7d) > 0 && Math.abs(maxApy7d) < 0.01) ? '<0.01' : abbreviateNumber(maxApy7d)

            return (
                <BodyText level={'body2'} weight={'medium'}>
                    {maxApy7d >= 0 ? '' : '-'}{`${Math.abs(Number(maxApy7dFormatted))}%`}
                </BodyText>
            )
        },
        enableGlobalFilter: false,
    },
    {
        accessorKey: 'deposits',
        accessorFn: (item) => Number(item.deposits),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Deposits</TooltipText>}
                content={
                    'Total amount of asset deposited in the pool as collateral so far.'
                }
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue('deposits')
            if (containsNegativeInteger(value)) {
                return (
                    <BodyText level={'body2'} weight={'medium'}>
                        -$
                        {abbreviateNumber(
                            Number(convertNegativeToPositive(value))
                        )}
                    </BodyText>
                )
            }
            return (
                <BodyText level={'body2'} weight={'medium'}>
                    ${abbreviateNumber(Number(value))}
                </BodyText>
            )
        },
        enableGlobalFilter: false,
    },
    {
        accessorKey: 'available_liquidity',
        accessorFn: (item) => Number(item.available_liquidity),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Available Liquidity</TooltipText>}
                content={
                    'Total amount of asset available to be borrowed.'
                }
            />
        ),
        cell: ({ row }) => {
            const value: number = row.original.available_liquidity

            if (containsNegativeInteger(value)) {
                return (
                    <BodyText level={'body2'} weight={'medium'}>
                        -$
                        {abbreviateNumber(
                            Number(convertNegativeToPositive(value))
                        )}
                    </BodyText>
                )
            }

            return (
                <BodyText level={'body2'} weight={'medium'}>
                    ${abbreviateNumber(Number(value))}
                </BodyText>
            )
        },
        enableGlobalFilter: false,
    },
    {
        accessorKey: 'max_leverage',
        accessorFn: (item) => {
            const loopPair = item as TLoopPair
            return loopPair.strategy?.max_leverage || 1
        },
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Max Leverage</TooltipText>}
                content={
                    'Maximum leverage multiplier available for this loop strategy.'
                }
            />
        ),
        cell: ({ row }) => {
            const loopPair = row.original as TLoopPair
            const maxLeverage = loopPair.strategy?.max_leverage || 1

            return (
                <BodyText level={'body2'} weight={'medium'}>
                    {maxLeverage.toFixed(1)}x
                </BodyText>
            )
        },
        enableGlobalFilter: false,
    },
    // {
    //     accessorKey: 'borrowToken',
    //     header: () => (
    //         <InfoTooltip
    //             side="bottom"
    //             label={<TooltipText>Borrows</TooltipText>}
    //             content={
    //                 'The asset that will be borrowed in this loop position.'
    //             }
    //         />
    //     ),
    //     cell: ({ row }) => {
    //         const borrowToken = (row.original as TLoopPair).borrowToken

    //         if (!borrowToken) {
    //             return (
    //                 <BodyText level={'body2'} weight={'medium'}>
    //                     -
    //                 </BodyText>
    //             )
    //         }

    //         return (
    //             <span className="flex items-center gap-[8px] w-fit max-w-full">
    //                 <ImageWithDefault
    //                     src={borrowToken.logo || ''}
    //                     alt={`${borrowToken.symbol} token logo`}
    //                     width={20}
    //                     height={20}
    //                     className="rounded-full max-w-[20px] max-h-[20px]"
    //                 />
    //                 <BodyText
    //                     level={'body2'}
    //                     weight={'medium'}
    //                     className="truncate"
    //                 >
    //                     {borrowToken.symbol}
    //                 </BodyText>
    //             </span>
    //         )
    //     },
    //     enableSorting: false,
    //     enableGlobalFilter: false,
    // },
]

function TooltipText({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <span
            className={`inline-block border-b border-dashed border-gray-800 ${className}`}
        >
            {children}
        </span>
    )
}

/**
 * Get rewards grouped by asset address
 * @param rewards
 * @returns rewards grouped by asset address
 */
function getRewardsGroupedByAsset(rewards: TReward[]) {
    return rewards.reduce((acc: TReward[], curr: TReward) => {
        const existing = acc.find(
            (item) => item.asset.address === curr.asset.address
        )
        if (existing) {
            existing.supply_apy += curr.supply_apy
        } else {
            acc.push(curr)
        }
        return acc
    }, [])
}

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
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800"
            >
                Rate & Rewards
            </BodyText>
            <div
                className="flex items-center justify-between gap-[70px] py-2"
                style={{ gap: '70px' }}
            >
                <div className="flex items-center gap-1">
                    <Percent className="w-[14px] h-[14px] text-gray-800" />
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
                            width={14}
                            height={14}
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

/**
 * Get apple rewards tooltip content
 * @param score
 * @returns apple rewards tooltip content
 */
function getAppleFarmRewardsTooltipContent(score: string) {
    return (
        <div className="flex flex-col divide-y divide-gray-800 max-w-[220px]">
            <div className="flex items-end justify-between gap-2 pb-2">
                <BodyText
                    level="body2"
                    weight="medium"
                    className="text-gray-800/75"
                >
                    APR:
                </BodyText>
                <div className="flex items-center gap-1">
                    <BodyText level="body2" weight="medium" className="text-gray-800">
                        {score}%
                    </BodyText>
                    <ImageWithDefault
                        src="/images/apple-farm-favicon.ico"
                        width={16}
                        height={16}
                        alt="Apple Farm"
                        className="inline-block"
                    />
                </div>
            </div>
            <BodyText level="body3" weight="medium" className="text-gray-800 pt-2">
                The APR factor indicates the proportion of daily rewards you receive relative to your contribution.
                <span onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <ExternalLink
                        href="https://app.applefarm.xyz/"
                        className='pl-1'
                    >
                        Know more
                    </ExternalLink>
                </span>
            </BodyText>
        </div>
    )
}

function getFormattedBaseRate(value: number) {
    return (Math.floor(Number(value) * 100) / 100).toFixed(2)
}

/**
 * Get strategy breakdown tooltip content
 * @param breakdown
 * @param maxAPY
 * @returns strategy breakdown tooltip content
 */
function getStrategyBreakdownTooltip({
    breakdown,
    maxAPY,
}: {
    breakdown: any[]
    maxAPY: number
}) {
    // Group items by type
    const supplyToken = breakdown.find(item => item.supply_apy > 0 && !item.asset.name.toLowerCase().includes('apple'))
    const borrowToken = breakdown.find(item => item.borrow_apy > 0)
    const appleFarmReward = breakdown.find(item => 
        item.asset.symbol === 'APPL' || 
        item.asset.name.toLowerCase().includes('apple')
    )

    return (
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800"
            >
                Strategy Breakdown
            </BodyText>
            {/* Supply Token APY */}
            {supplyToken && (
                <div
                    className="flex items-center justify-between gap-[70px] py-2"
                    style={{ gap: '70px' }}
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src={supplyToken.asset.logo}
                            width={14}
                            height={14}
                            alt={supplyToken.asset.name}
                            className="inline-block rounded-full object-contain"
                        />
                        <Label
                            weight="medium"
                            className="truncate text-gray-800 max-w-[100px] truncate"
                            title={supplyToken.asset.name}
                        >
                            {supplyToken.asset.symbol}
                        </Label>
                    </div>
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-800"
                    >
                        + {abbreviateNumber(supplyToken.supply_apy || 0, 2)}%
                    </BodyText>
                </div>
            )}
            {/* Borrow Token APY */}
            {borrowToken && (
                <div
                    className="flex items-center justify-between gap-[70px] py-2"
                    style={{ gap: '70px' }}
                >
                    <div className="flex items-center gap-1">
                        <ImageWithDefault
                            src={borrowToken.asset.logo}
                            width={14}
                            height={14}
                            alt={borrowToken.asset.name}
                            className="inline-block rounded-full object-contain"
                        />
                        <Label
                            weight="medium"
                            className="truncate text-gray-800 max-w-[100px] truncate"
                            title={borrowToken.asset.name}
                        >
                            {borrowToken.asset.symbol}
                        </Label>
                    </div>
                    <BodyText
                        level="body3"
                        weight="medium"
                        className="text-gray-800"
                    >
                        - {abbreviateNumber(borrowToken.borrow_apy || 0, 2)}%
                    </BodyText>
                </div>
            )}
            {/* Apple Farm Rewards */}
            {appleFarmReward && appleFarmReward.supply_apy > 0 && (
                <div
                    className="flex items-center justify-between gap-[70px] py-2"
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
                        + {abbreviateNumber(appleFarmReward.supply_apy || 0, 2)}%
                    </BodyText>
                </div>
            )}
            {/* Net APY */}
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
                    = {maxAPY === 0 ? '0.00' : abbreviateNumber(maxAPY, 2)}%
                </BodyText>
            </div>
        </div>
    )
}
