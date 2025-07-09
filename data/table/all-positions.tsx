'use client'

import ImageWithBadge from '@/components/ImageWithBadge'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import TooltipText from '@/components/tooltips/TooltipText'
import { Badge } from '@/components/ui/badge'
import { BodyText, Label } from '@/components/ui/typography'
import { PositionsContext } from '@/context/positions-provider'
import useDimensions from '@/hooks/useDimensions'
import {
    abbreviateNumber,
    capitalizeText,
    containsNegativeInteger,
    convertNegativeToPositive,
    convertScientificToNormal,
    getPlatformVersion,
    isLowestNegativeValue,
    isLowestValue,
} from '@/lib/utils'
import { PlatformType } from '@/types/platform'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { useContext } from 'react'

export type TPositions = {
    token: string
    platform: string
    chain: string
    apy: string
    max_ltv: string
    deposits: string
    utilization: string
    token_image: string
    chain_image: string
    platform_image: string
}

export type TPositionsTable = {
    tokenAddress: string
    tokenSymbol: string
    tokenName: string
    tokenLogo: string
    chain_id: number
    chainName: string
    chainLogo: string
    platform_id: string
    protocol_identifier: string
    platformName: string
    platformWithMarketName: string
    platformLogo: string
    apy: number
    deposits: string
    borrows: string
    earnings: number
    isVault: boolean
    positionType: string
}

export type TLoopPositionsTable = {
    platform_id: string
    protocol_identifier: string
    platformName: string
    platformLogo: string
    chainName: string
    chainLogo: string
    chain_id: number
    core_contract?: string
    lendTokenAddress: string
    lendTokenSymbol: string
    lendTokenName: string
    lendTokenLogo: string
    lendAmount: number
    lendApy: number
    borrowTokenAddress: string
    borrowTokenSymbol: string
    borrowTokenName: string
    borrowTokenLogo: string
    borrowAmount: number
    borrowApy: number
    leverage: number
    netApy: number
    pnl: number
    healthFactor: number
    totalLiquidity: number
    totalBorrow: number
}

export const columns: ColumnDef<TPositionsTable>[] = [
    {
        accessorKey: 'tokenSymbol',
        header: 'Token',
        accessorFn: (item) => item.tokenSymbol,
        cell: ({ row }) => {
            const { width: screenWidth } = useDimensions()
            const { positionType } = useContext<any>(PositionsContext)
            const tokenSymbol: string = row.getValue('tokenSymbol') || ''
            const tokenLogo = row.original.tokenLogo || ''
            const tokenAddress = row.original.tokenAddress
            const tokenName = row.original.tokenName
            const chainId = row.original.chain_id
            const chainLogo = row.original.chainLogo || ''
            const chainName = row.original.chainName || ''
            const platformId = row.original.platform_id
            const protocolIdentifier = row.original.protocol_identifier
            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Token</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault
                                alt={tokenSymbol}
                                src={tokenLogo}
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
                        <Label>Chain</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault
                                alt={chainName}
                                src={chainLogo}
                                width={24}
                                height={24}
                                className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                            />
                            <BodyText level="body2" weight="medium">
                                {capitalizeText(chainName)}
                            </BodyText>
                        </span>
                    </span>
                </span>
            )

            return (
                <BodyText
                    level="body2"
                    weight="medium"
                    className="flex items-center gap-[8px] w-fit max-w-full"
                >
                    <InfoTooltip
                        hide={screenWidth < 768}
                        label={
                            <ImageWithBadge
                                mainImg={tokenLogo}
                                badgeImg={chainLogo}
                                mainImgAlt={tokenSymbol}
                                badgeImgAlt={chainName}
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
                                position_type: positionType,
                            },
                        }}
                        className="truncate"
                    >
                        <BodyText
                            level={'body2'}
                            weight={'medium'}
                            className="truncate block shrink-0 hover:text-secondary-500"
                        >
                            {tokenSymbol}
                        </BodyText>
                    </Link>
                    {/* <InfoTooltip iconWidth={16} iconHeight={16} content={tooltipContent} /> */}
                </BodyText>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'platformName',
        header: 'Platform',
        accessorFn: (item) => item.platformName,
        cell: ({ row }) => {
            const platformName: string = row.getValue('platformName')
            const platformId: string = row.original.platform_id
            const platformWithMarketName: string = row.original.platformWithMarketName
            const isMorpho =
                platformId.split('-')[0].toLowerCase() === PlatformType.MORPHO
            const isVault = row.original.isVault
            const formattedPlatformWithMarketName: string = (isMorpho && isVault && row.original.chainName.toLowerCase() === 'polygon')
                ? "Compound Morpho Vaults"
                : (platformWithMarketName.includes("/") && !platformWithMarketName.split(' ')[0].toLowerCase().includes(platformId.split('-')[0].toLowerCase()))
                    ? platformWithMarketName
                    : platformWithMarketName.split(' ').slice(1).join(' ')
            // const morphoLabel =
            //     isMorpho && isVault ? 'Morpho Vaults' : 'Morpho Markets'
            // const formattedPlatformName = isMorpho ? morphoLabel : platformName
            const platformDisplayName = `${capitalizeText(platformName.split(' ')[0])} ${getPlatformVersion(platformId)}`;
            const showPlatformCuratorName = platformDisplayName.split(' ')[1].toLowerCase() !== formattedPlatformWithMarketName.toLowerCase();


            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        src={row.original.platformLogo || ''}
                        alt={row.original.platformName || ''}
                        width={20}
                        height={20}
                        className="w-[20px] h-[20px] max-w-[20px] max-h-[20px]"
                    />
                    <span className="flex flex-col gap-[0px]">
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="truncate leading-0"
                            title={platformWithMarketName}
                        >
                            {`${capitalizeText(platformName)} ${getPlatformVersion(platformId)}`}
                        </BodyText>
                        {showPlatformCuratorName &&
                            <Label className="text-gray-800 leading-0 truncate max-w-[120px]">
                                {formattedPlatformWithMarketName}
                            </Label>
                        }
                    </span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'apy',
        accessorFn: (item) => Number(item.apy),
        header: () => {
            const { positionType } = useContext<any>(PositionsContext)
            const lendTooltipContent =
                '% interest you earn on deposits over a year. This includes compounding.'
            const borrowTooltipContent =
                '% interest you pay for your borrows over a year. This includes compunding.'
            const tooltipContent =
                positionType === 'lend'
                    ? lendTooltipContent
                    : borrowTooltipContent
            return (
                <InfoTooltip
                    side="bottom"
                    label={<TooltipText>APY</TooltipText>}
                    content={tooltipContent}
                />
            )
        },
        cell: ({ row }) => {
            const apy: number = Number(row.getValue('apy'))
            const sanitizedValue = isLowestValue(Number(apy))
                ? '<0.01'
                : getSanitizedValue(Number(apy))

            // if (`${apy.toFixed(2)}` === '0.00') {
            //     return (
            //         <InfoTooltip
            //             side="bottom"
            //             label={
            //                 <TooltipText>{`${apy.toFixed(2)}%`}</TooltipText>
            //             }
            //             content={'This asset is non-borrowable'}
            //         />
            //     )
            // }

            function getSanitizedValue(value: string | number) {
                if (containsNegativeInteger(value)) {
                    return `- ${abbreviateNumber(Number(convertNegativeToPositive(value)) ?? 0)}`
                }
                return `${abbreviateNumber(Number(value) ?? 0)}`
            }

            return (
                <BodyText level="body2" weight="medium">
                    {`${sanitizedValue}%`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: 'deposits',
        accessorFn: (item) => Number(item.deposits),
        header: () => {
            const { positionType } = useContext<any>(PositionsContext)
            return (
                <InfoTooltip
                    side="bottom"
                    label={<TooltipText>{positionType === 'all' ? 'Deposits/Borrows' : 'Deposits'}</TooltipText>}
                    content={
                        positionType === 'all' 
                            ? 'Total amount of asset deposited in the pool as collateral or borrowed from the pool.'
                            : 'Total amount of asset deposited in the pool as collateral so far.'
                    }
                />
            )
        },
        cell: ({ row }) => {
            const value: number = Number(row.getValue('deposits'))
            const isLowestValue = value < 0.01
            const sanitizedValue = isLowestValue
                ? '0.01'
                : abbreviateNumber(value)

            return (
                <BodyText level="body2" weight="medium">
                    {`${isLowestValue ? '< ' : ''} $${sanitizedValue}`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
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
            const value: number = Number(row.getValue('borrows'))
            const isLowestValue = value < 0.01
            const sanitizedValue = isLowestValue
                ? '0.01'
                : abbreviateNumber(value)

            return (
                <BodyText level="body2" weight="medium">
                    {`${isLowestValue ? '< ' : ''} $${sanitizedValue}`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: 'positionType',
        accessorFn: (item) => item.positionType,
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Type</TooltipText>}
                content={'Whether this is a lending or borrowing position.'}
            />
        ),
        cell: ({ row }) => {
            const positionType = row.original.positionType
            return (
                <Badge variant={positionType === 'lend' ? 'green' : 'blue'}>
                    {positionType === 'lend' ? 'Lend' : 'Borrow'}
                </Badge>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'earnings',
        accessorFn: (item) => Number(item.earnings),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Earnings</TooltipText>}
                content={
                    'Earnings are the difference in your collateral balance multiplied by the value of token.'
                }
            />
        ),
        cell: ({ row }) => {
            const { positionType } = useContext<any>(PositionsContext)

            // Get the raw value first
            const rawValue = row.getValue('earnings')

            // Convert scientific notation to regular number string
            const value = Number(rawValue).toFixed(10)

            const sanitizedValue =
                Math.abs(Number(value)) === 0
                    ? '$0.00'
                    : Math.abs(Number(value)) < 0.01
                        ? '< $0.01'
                        : getSanitizedValue(value)

            const getPrefixSign = () => {
                if (positionType === 'lend') {
                    return Number(value) < 0
                        ? '-'
                        : Number(value) > 0
                            ? '+'
                            : ''
                }
                return Number(value) === 0 ? '' : '-'
            }

            function getSanitizedValue(value: string) {
                const numValue = Number(value)
                if (numValue < 0) {
                    return `$${abbreviateNumber(Math.abs(numValue))}`
                }
                return `$${abbreviateNumber(numValue)}`
            }

            const getBadgeVariant = () => {
                if (positionType === 'lend') {
                    return Number(value) < 0
                        ? 'destructive'
                        : Number(value) > 0
                            ? 'green'
                            : 'default'
                }
                return Number(value) === 0 ? 'default' : 'destructive'
            }

            return (
                <Badge variant={getBadgeVariant()}>
                    {getPrefixSign()}{' '}
                    {sanitizedValue === '$0.00' ? 'N/A' : sanitizedValue}
                </Badge>
            )
        },
        // enableGlobalFilter: false,
    },
]

export const loopColumns: ColumnDef<TLoopPositionsTable>[] = [
    {
        accessorKey: 'platformName',
        header: 'Platform',
        accessorFn: (item) => item.platformName,
        cell: ({ row }) => {
            const platformName: string = row.getValue('platformName')
            const platformLogo = row.original.platformLogo || ''
            const chainLogo = row.original.chainLogo || ''
            const chainName = row.original.chainName || ''

            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithBadge
                        mainImg={platformLogo}
                        badgeImg={chainLogo}
                        mainImgAlt={platformName}
                        badgeImgAlt={chainName}
                    />
                    <span className="flex flex-col gap-[0px]">
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="truncate leading-0"
                        >
                            {platformName}
                        </BodyText>
                        <Label className="text-gray-800 leading-0 truncate max-w-[120px]">
                            {capitalizeText(chainName)}
                        </Label>
                    </span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'lendTokenSymbol',
        header: 'Lend Token',
        accessorFn: (item) => item.lendTokenSymbol,
        cell: ({ row }) => {
            const lendTokenSymbol: string = row.getValue('lendTokenSymbol') || ''
            const lendTokenLogo = row.original.lendTokenLogo || ''
            const lendTokenName = row.original.lendTokenName || ''
            const lendAmount = row.original.lendAmount || 0
            const lendApy = row.original.lendApy || 0

            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        src={lendTokenLogo}
                        alt={lendTokenSymbol}
                        width={24}
                        height={24}
                        className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                    />
                    <span className="flex flex-col gap-[0px]">
                        <BodyText level="body2" weight="medium" className="truncate leading-0">
                            {lendTokenSymbol}
                        </BodyText>
                        <Label className="text-gray-800 leading-0 truncate max-w-[120px]">
                            ${abbreviateNumber(lendAmount)} • {abbreviateNumber(lendApy)}%
                        </Label>
                    </span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'borrowTokenSymbol',
        header: 'Borrow Token',
        accessorFn: (item) => item.borrowTokenSymbol,
        cell: ({ row }) => {
            const borrowTokenSymbol: string = row.getValue('borrowTokenSymbol') || ''
            const borrowTokenLogo = row.original.borrowTokenLogo || ''
            const borrowTokenName = row.original.borrowTokenName || ''
            const borrowAmount = row.original.borrowAmount || 0
            const borrowApy = row.original.borrowApy || 0

            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithDefault
                        src={borrowTokenLogo}
                        alt={borrowTokenSymbol}
                        width={24}
                        height={24}
                        className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]"
                    />
                    <span className="flex flex-col gap-[0px]">
                        <BodyText level="body2" weight="medium" className="truncate leading-0">
                            {borrowTokenSymbol}
                        </BodyText>
                        <Label className="text-gray-800 leading-0 truncate max-w-[120px]">
                            ${abbreviateNumber(borrowAmount)} • {abbreviateNumber(borrowApy)}%
                        </Label>
                    </span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'leverage',
        accessorFn: (item) => Number(item.leverage),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Leverage</TooltipText>}
                content={'Current leverage ratio calculated as Lend Amount / (Lend Amount - Borrow Amount).'}
            />
        ),
        cell: ({ row }) => {
            const leverage: number = Number(row.getValue('leverage'))
            const sanitizedValue = leverage > 100 ? '100+' : leverage.toFixed(2)

            return (
                <BodyText level="body2" weight="medium">
                    {sanitizedValue}x
                </BodyText>
            )
        },
    },
    {
        accessorKey: 'netApy',
        accessorFn: (item) => Number(item.netApy),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Net APY</TooltipText>}
                content={'Net APY after borrowing costs and lending rewards.'}
            />
        ),
        cell: ({ row }) => {
            const netApy: number = Number(row.getValue('netApy'))
            const sanitizedValue = isLowestValue(Number(netApy))
                ? '<0.01'
                : abbreviateNumber(Number(netApy))

            return (
                <BodyText level="body2" weight="medium">
                    {`${sanitizedValue}%`}
                </BodyText>
            )
        },
    },
    {
        accessorKey: 'healthFactor',
        accessorFn: (item) => Number(item.healthFactor),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>Health Factor</TooltipText>}
                content={'Health factor indicates how safe your position is. Below 1.0 means liquidation risk.'}
            />
        ),
        cell: ({ row }) => {
            const healthFactor: number = Number(row.getValue('healthFactor'))
            const isRisky = healthFactor < 1.2
            const sanitizedValue = healthFactor > 100 ? '100+' : healthFactor.toFixed(2)

            return (
                <Badge variant={isRisky ? 'destructive' : 'green'}>
                    {sanitizedValue}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'pnl',
        accessorFn: (item) => Number(item.pnl),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={<TooltipText>PnL</TooltipText>}
                content={'Profit and Loss of the loop position.'}
            />
        ),
        cell: ({ row }) => {
            const pnl: number = Number(row.getValue('pnl'))
            const sanitizedValue = Math.abs(pnl) < 0.01
                ? '< $0.01'
                : `$${abbreviateNumber(Math.abs(pnl))}`

            const getPrefixSign = () => {
                return pnl < 0 ? '-' : pnl > 0 ? '+' : ''
            }

            const getBadgeVariant = () => {
                return pnl < 0 ? 'destructive' : pnl > 0 ? 'green' : 'default'
            }

            return (
                <Badge variant={getBadgeVariant()}>
                    {getPrefixSign()} {sanitizedValue === '$0.00' ? 'N/A' : sanitizedValue}
                </Badge>
            )
        },
    },
]
