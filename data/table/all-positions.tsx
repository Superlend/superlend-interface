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
