'use client'

import ImageWithBadge from '@/components/ImageWithBadge'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { Badge } from '@/components/ui/badge'
import { BodyText, Label } from '@/components/ui/typography'
import { PAIR_BASED_PROTOCOLS } from '@/constants'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import {
    abbreviateNumber,
    capitalizeText,
    containsNegativeInteger,
    convertNegativeToPositive,
    getPlatformVersion,
} from '@/lib/utils'
import { TOpportunityTable, TReward } from '@/types'
import { PlatformType } from '@/types/platform'
import { ColumnDef } from '@tanstack/react-table'
import { ChartNoAxesColumnIncreasing, ShieldAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: 'platformName',
        header: 'Platform',
        accessorFn: (item) => item.platformName,
        cell: ({ row }) => {
            const { logEvent } = useAnalytics()
            const { walletAddress } = useWalletConnection()
            const searchParams = useSearchParams()
            const platformName: string = row.getValue('platformName')
            const platformLogo = row.original.platformLogo
            const platformId: string = row.original.platformId
            const platformWithMarketName: string =
                row.original.platformWithMarketName
            const isMorpho =
                row.original.platformId.split('-')[0].toLowerCase() ===
                PlatformType.MORPHO
            const isVault = row.original.isVault
            const tokenSymbol = row.original.tokenSymbol
            const tokenAddress = row.original.tokenAddress
            const protocolIdentifier = row.original.protocol_identifier
            const chainId = row.original.chain_id
            const chainLogo = row.original.chainLogo
            const chainName = row.original.chainName
            const positionTypeParam = searchParams.get('position_type') || 'lend'

            const formattedPlatformWithMarketName: string = platformWithMarketName.split(' ').slice(1).join(' ')
            const platformDisplayName = `${capitalizeText(platformName.split(' ')[0])} ${getPlatformVersion(platformId)}`;
            const showPlatformCuratorName = platformDisplayName.split(' ')[1].toLowerCase() !== formattedPlatformWithMarketName.toLowerCase();


            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Platform</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault
                                alt={platformWithMarketName}
                                src={platformLogo || ''}
                                width={24}
                                height={24}
                                className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                            />
                            <BodyText level="body2" weight="medium">
                                {platformWithMarketName}
                            </BodyText>
                        </span>
                    </span>
                    <span className="flex flex-col gap-[4px]">
                        <Label>Chain</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault
                                alt={chainName}
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
                <span className="flex items-center gap-[8px]">
                    <InfoTooltip
                        label={
                            <ImageWithBadge
                                mainImg={platformLogo || ''}
                                badgeImg={chainLogo || ''}
                                mainImgAlt={platformName}
                                badgeImgAlt={chainName}
                            />
                        }
                        content={tooltipContent}
                    />
                    <span className="flex flex-col gap-[0px] max-w-full truncate">
                        <BodyText
                            level={'body2'}
                            weight={'medium'}
                            className="truncate capitalize max-w-full"
                            title={platformWithMarketName}
                        >
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
                                className="truncate"
                            >
                                {`${capitalizeText(platformName)} ${getPlatformVersion(platformId)}`}
                            </Link>
                        </BodyText>
                        {showPlatformCuratorName &&
                            <Label
                                title={formattedPlatformWithMarketName}
                                className="inline-block text-gray-800 leading-0 capitalize truncate max-w-full"
                            >
                                {formattedPlatformWithMarketName}
                            </Label>
                        }
                    </span>
                </span>
            )
        },
        enableSorting: false,
        // enableGlobalFilter: false,
    },
    {
        accessorKey: 'apy_avg_7days',
        accessorFn: (item) => Number(item.apy_avg_7days),
        header: () => {
            const searchParams = useSearchParams()
            const positionTypeParam =
                searchParams.get('position_type') || 'lend'
            const lendTooltipContent =
                '% 7 day average interest you earn on deposits over a year. This excludes rewards.'
            const borrowTooltipContent =
                '% 7 day average interest you pay for your borrows over a year. This excludes rewards.'
            const tooltipContent =
                positionTypeParam === 'lend'
                    ? lendTooltipContent
                    : borrowTooltipContent

            return (
                <InfoTooltip
                    side="bottom"
                    label={<TooltipText>7D Base APY</TooltipText>}
                    content={tooltipContent}
                />
            )
        },
        cell: ({ row }) => {
            const searchParams = useSearchParams()
            const positionTypeParam =
                searchParams.get('position_type') || 'lend'
            const apy7DayAvg = Number(row.getValue('apy_avg_7days'))
            const apy7DayAvgFormatted = abbreviateNumber(apy7DayAvg)

            return (
                <span className="flex items-center gap-1">
                    <BodyText level={'body2'} weight={'medium'}>
                        {`${apy7DayAvgFormatted}%`}
                    </BodyText>
                </span>
            )
        },
        enableGlobalFilter: false,
    },
    {
        accessorKey: 'max_ltv',
        accessorFn: (item) => Number(item.max_ltv),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Max LTV</TooltipText>}
                content={
                    'Maximum amount that can be borrowed against the value of collateral.'
                }
            />
        ),
        cell: ({ row }) => {
            const isMorpho =
                row.original.platformId.split('-')[0].toLowerCase() ===
                PlatformType.MORPHO
            const isVault = row.original.isVault

            if (isMorpho && isVault) {
                return (
                    <InfoTooltip
                        label={<Badge>N/A</Badge>}
                        content="This does not apply to Morpho vaults, as the curator maintains this."
                    />
                )
            }

            return (
                <span className="flex items-center gap-2">
                    {Number(row.getValue('max_ltv')) > 0 && (
                        <BodyText level={'body2'} weight={'medium'}>
                            {`${Number(row.getValue('max_ltv')).toFixed(2)}%`}
                        </BodyText>
                    )}
                    {Number(row.getValue('max_ltv')) === 0 && (
                        <InfoTooltip
                            label={
                                <TooltipText>
                                    <BodyText level={'body2'} weight={'medium'}>
                                        {`${row.getValue('max_ltv')}%`}
                                    </BodyText>
                                </TooltipText>
                            }
                            content="This asset cannot be used as collateral to take out a loan"
                        />
                    )}
                </span>
            )
        },
        size: 150,
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
        accessorKey: 'borrows',
        accessorFn: (item) => Number(item.borrows),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Borrows</TooltipText>}
                content={'Total amount of asset borrowed from the pool.'}
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue('borrows')
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
        accessorKey: 'utilization',
        accessorFn: (item) => Number(item.utilization),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Utilization</TooltipText>}
                content={
                    'Ratio between the amount borrowed and the amount deposited.'
                }
            />
        ),
        cell: ({ row }) => {
            const isMorpho =
                row.original.platformId.split('-')[0].toLowerCase() ===
                PlatformType.MORPHO
            const isVault = row.original.isVault

            if (isMorpho && isVault) {
                return (
                    <InfoTooltip
                        label={<Badge>N/A</Badge>}
                        content="This does not apply to Morpho vaults, as the curator maintains this."
                    />
                )
            }

            if (`${Number(row.getValue('utilization')).toFixed(1)}` === '0.0') {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>
                                <BodyText level={'body2'} weight={'medium'}>
                                    {`${Number(row.getValue('utilization')).toFixed(1)}%`}
                                </BodyText>
                            </TooltipText>
                        }
                        content={'This asset is non-borrowable'}
                    />
                )
            }

            return (
                <BodyText level={'body2'} weight={'medium'}>
                    {`${Number(row.getValue('utilization')).toFixed(2)}%`}
                </BodyText>
            )
        },
        enableGlobalFilter: false,
    },
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
}: {
    baseRateFormatted: string
    rewards: TReward[]
    apyCurrent: number
    positionTypeParam: string
}) {
    const baseRateOperator = positionTypeParam === 'lend' ? '+' : '-'
    const isLend = positionTypeParam === 'lend'

    return (
        <div className="flex flex-col divide-y divide-gray-800">
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
                    <ImageWithDefault
                        src="/icons/sparkles.svg"
                        alt="Net APY"
                        width={16}
                        height={16}
                        className="inline-block"
                    />
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

function getFormattedBaseRate(value: number) {
    return (Math.floor(Number(value) * 100) / 100).toFixed(2)
}
