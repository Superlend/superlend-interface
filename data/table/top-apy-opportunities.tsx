'use client'

import ExternalLink from '@/components/ExternalLink'
import ImageWithBadge from '@/components/ImageWithBadge'
import ImageWithDefault from '@/components/ImageWithDefault'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import AvatarCircles from '@/components/ui/avatar-circles'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BodyText, Label } from '@/components/ui/typography'
import { PAIR_BASED_PROTOCOLS } from '@/constants'
import { useAssetsDataContext } from '@/context/data-provider'
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
import { ColumnDef } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { ChartNoAxesColumnIncreasing, Percent, ShieldAlertIcon, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: 'tokenSymbol',
        header: () => "Token",
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
            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Token</Label>
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
                            <ImageWithBadge
                                mainImg={tokenLogo || ''}
                                badgeImg={chainLogo || ''}
                                mainImgAlt={`${tokenSymbol} token logo`}
                                badgeImgAlt={`${chainName} chain logo`}
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
                        className="truncate"
                    >
                        <BodyText
                            level={'body2'}
                            weight={'medium'}
                            className="truncate block shrink-0 hover:text-secondary-500 active:text-secondary-500"
                        >
                            {tokenSymbol}
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
        id: 'collateral_tokens',
        header: "Collateral",
        cell: ({ row }) => {
            const { allTokensData } = useAssetsDataContext()
            const MAX_ITEMS_TO_SHOW = 5
            const collateralTokensData = row.original.collateral_tokens ?? [];

            const filteredCollateralTokensData = collateralTokensData.filter((tokenAddress: `0x${string}`) => {
                const token = allTokensData[row.original.chain_id].find(
                    (asset: any) =>
                        asset?.address?.toLowerCase() ===
                        tokenAddress?.toLowerCase()
                )
                return !!token?.name
            })

            const tokenImages = filteredCollateralTokensData?.map(
                (tokenAddress: `0x${string}`) =>
                    allTokensData[row.original.chain_id].find(
                        (asset: any) =>
                            asset?.address?.toLowerCase() ===
                            tokenAddress?.toLowerCase()
                    )?.logo
            )

            const tokenDetails = filteredCollateralTokensData?.map(
                (tokenAddress: `0x${string}`) => {
                    const token = allTokensData[row.original.chain_id].find(
                        (asset: any) =>
                            asset?.address?.toLowerCase() ===
                            tokenAddress?.toLowerCase()
                    )
                    return {
                        name: token?.name,
                        logo: token?.logo,
                        symbol: token?.symbol,
                    }
                }
            )

            const moreItemsData = tokenDetails?.filter((_, index) => index > MAX_ITEMS_TO_SHOW - 1)

            return (
                <div className="w-full flex items-center justify-start gap-1">
                    <AvatarCircles
                        avatarUrls={
                            tokenImages ?? []
                        }
                        avatarDetails={tokenDetails?.map(
                            (token) => ({
                                content: token.name,
                            })
                        )}
                        showMoreItemsTooltip={moreItemsData.length > 0}
                        maxItemsToShow={MAX_ITEMS_TO_SHOW}
                        moreItemsTooltipContent={
                            <ScrollArea type="always" className={`${moreItemsData.length > 5 ? 'h-[200px]' : 'h-[50px]'} w-full rounded-md p-0 pr-6`}>
                                <div className="flex flex-col gap-2">
                                    {moreItemsData
                                        .filter((token) => !!token && !!token.name)
                                        .map((token: any) => (
                                            <div className="flex items-center gap-2">
                                                <ImageWithDefault
                                                    src={token.logo}
                                                    width={16}
                                                    height={16}
                                                    alt={`${token.name} token logo`}
                                                    className="rounded-full shrink-0"
                                                />
                                                <BodyText level="body2" weight="medium">
                                                    {token.name}
                                                </BodyText>
                                            </div>
                                        ))}
                                </div>
                            </ScrollArea>
                        }
                    />
                    {tokenImages.length === 1 &&
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800 truncate max-w-[100px]"
                            title={tokenDetails[0].name}
                        >
                            {tokenDetails[0].symbol}
                        </BodyText>
                    }
                </div>
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
        accessorKey: 'apy_current',
        accessorFn: (item) => Number(item.apy_current) + (item.has_apple_farm_rewards ? Number(item.apple_farm_apr) : 0),
        header: () => {
            const searchParams = useSearchParams()
            const positionTypeParam =
                searchParams?.get('position_type') || 'lend'
            const lendTooltipContent =
                '% interest you earn on deposits over a year. This includes compounding.'
            const borrowTooltipContent =
                '% interest you pay for your borrows over a year. This includes compunding.'
            const tooltipContent =
                positionTypeParam === 'lend'
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
            const searchParams = useSearchParams()
            const positionTypeParam =
                searchParams?.get('position_type') || 'lend'
            const hasRewards =
                row.original?.additional_rewards &&
                row.original?.rewards.length > 0
            // Declare tooltip content related variables
            let baseRate, baseRateFormatted, rewards, totalRewards
            const isLend = positionTypeParam === 'lend'
            const isPairBasedProtocol = PAIR_BASED_PROTOCOLS.includes(
                row.original?.platformId.split('-')[0].toLowerCase()
            )
            const isEtherlinkChain = row.original.chain_id === ChainId.Etherlink
            const appleFarmApr = Number(row.original.apple_farm_apr)
            const hasAppleFarmRewards = row.original.has_apple_farm_rewards

            const apyCurrent = Number(row.getValue('apy_current'))
            const apyCurrentFormatted = (apyCurrent > 0 && apyCurrent < 0.01) ? '<0.01' : abbreviateNumber(apyCurrent)

            const appleFarmBaseRate = Number(row.original.apy_current)
            const appleFarmBaseRateFormatted = appleFarmBaseRate < 0.01 && appleFarmBaseRate > 0
                ? '<0.01'
                : abbreviateNumber(appleFarmBaseRate)
            const netAppleFarmAPY = Number(row.original.apy_current) + Number(appleFarmApr ?? 0)
            const netAppleFarmAPYFormatted = netAppleFarmAPY > 0 && netAppleFarmAPY < 0.01
                ? '<0.01'
                : abbreviateNumber(netAppleFarmAPY)

            const appleFarmRewards = [
                {
                    asset: {
                        address: row.original.tokenAddress as `0x${string}`,
                        name: "APR",
                        symbol: row.original.tokenSymbol,
                        logo: '/images/apple-farm-favicon.ico',
                        decimals: 0,
                        price_usd: 0,
                    },
                    supply_apy: appleFarmApr,
                    borrow_apy: 0,
                }
            ]

            if (hasRewards) {
                // Update rewards grouped by asset address
                rewards = getRewardsGroupedByAsset(row.original?.rewards)
                // Get total rewards
                totalRewards = rewards.reduce(
                    (acc, curr) =>
                        acc +
                        Number(isLend ? curr.supply_apy : curr.borrow_apy),
                    0
                )
                // Lend base rate = APY - Asset Total Rewards
                const lendBaseRate = apyCurrent - totalRewards
                // Borrow base rate = APY + Asset Total Rewards
                const borrowBaseRate = apyCurrent + totalRewards
                baseRate = Number(isLend ? lendBaseRate : borrowBaseRate)
                baseRateFormatted =
                    baseRate < 0.01 && baseRate > 0
                        ? '<0.01'
                        : abbreviateNumber(baseRate)
            }

            if (
                apyCurrentFormatted === '0.00' &&
                !isPairBasedProtocol &&
                !isLend
            ) {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>
                                <BodyText level={'body2'} weight={'medium'}>
                                    {`${apyCurrentFormatted}%`}
                                </BodyText>
                            </TooltipText>
                        }
                        content={'This asset is non-borrowable'}
                    />
                )
            }

            return (
                <span className="flex items-center gap-1">
                    <BodyText level={'body2'} weight={'medium'}>
                        {`${(isEtherlinkChain && hasAppleFarmRewards && positionTypeParam === 'lend') ? netAppleFarmAPYFormatted : apyCurrentFormatted}%`}
                    </BodyText>
                    {/* REWARDS */}
                    {(hasRewards && !(isEtherlinkChain && hasAppleFarmRewards && positionTypeParam === 'lend')) && (
                        <InfoTooltip
                            label={
                                <span onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <ImageWithDefault
                                        src="/icons/sparkles.svg"
                                        alt="Rewards"
                                        width={22}
                                        height={22}
                                        className="cursor-pointer hover:scale-110"
                                    />
                                </span>
                            }
                            content={getRewardsTooltipContent({
                                baseRateFormatted: baseRateFormatted || '',
                                rewards: rewards || [],
                                apyCurrent: apyCurrent || 0,
                                positionTypeParam,
                            })}
                        />
                    )}
                    {/* APPLE FARM REWARDS */}
                    {(isEtherlinkChain && hasAppleFarmRewards && positionTypeParam === 'lend') && (
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
                                        alt="Etherlink Rewards"
                                        width={16}
                                        height={16}
                                    />
                                </motion.div>
                            }
                            content={getAppleFarmAPYTooltipContent({
                                baseAPY: appleFarmBaseRate,
                                appleFarmAPR: appleFarmApr,
                                totalAPY: netAppleFarmAPY,
                            })}
                        />
                    )}
                </span>
            )
        },
        enableGlobalFilter: false,
    },
    {
        accessorKey: 'apy_avg_7days',
        accessorFn: (item) => Number(item.apy_avg_7days),
        header: () => {
            const searchParams = useSearchParams()
            const positionTypeParam =
                searchParams?.get('position_type') || 'lend'
            const lendTooltipContent =
                '% 7 day average interest you earn on deposits over a year. This exludes rewards.'
            const borrowTooltipContent =
                '% 7 day average interest you pay for your borrows over a year. This exludes rewards.'
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
            const apy7DayAvg = Number(row.getValue('apy_avg_7days'))
            const apy7DayAvgFormatted = abbreviateNumber(apy7DayAvg)

            return (
                <BodyText level={'body2'} weight={'medium'}>
                    {`${apy7DayAvgFormatted}%`}
                </BodyText>
            )
        },
        enableGlobalFilter: false,
    },
    // {
    //     accessorKey: 'max_ltv',
    //     accessorFn: (item) => Number(item.max_ltv),
    //     header: () => (
    //         <InfoTooltip
    //             side="bottom"
    //             label={<TooltipText>Max LTV</TooltipText>}
    //             content={
    //                 'Maximum amount that can be borrowed against the value of collateral.'
    //             }
    //         />
    //     ),
    //     cell: ({ row }) => {
    //         const isMorpho =
    //             row.original.platformId.split('-')[0].toLowerCase() ===
    //             PlatformType.MORPHO
    //         const isVault = row.original.isVault

    //         if (isMorpho && isVault) {
    //             return (
    //                 <InfoTooltip
    //                     label={<Badge>N/A</Badge>}
    //                     content="This does not apply to Morpho vaults, as the curator maintains this."
    //                 />
    //             )
    //         }

    //         return (
    //             <span className="flex items-center gap-2">
    //                 {Number(row.getValue('max_ltv')) > 0 && (
    //                     <BodyText level={'body2'} weight={'medium'}>
    //                         {`${Number(row.getValue('max_ltv')).toFixed(2)}%`}
    //                     </BodyText>
    //                 )}
    //                 {Number(row.getValue('max_ltv')) === 0 && (
    //                     <InfoTooltip
    //                         label={
    //                             <TooltipText>
    //                                 <BodyText level={'body2'} weight={'medium'}>
    //                                     {`${row.getValue('max_ltv')}%`}
    //                                 </BodyText>
    //                             </TooltipText>
    //                         }
    //                         content="This asset cannot be used as collateral to take out a loan"
    //                     />
    //                 )}
    //             </span>
    //         )
    //     },
    //     size: 150,
    //     enableGlobalFilter: false,
    // },
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
        accessorKey: 'collateral_exposure',
        header: 'Collateral Exposure',
        cell: ({ row }) => {
            const { allTokensData } = useAssetsDataContext()
            const MAX_ITEMS_TO_SHOW = 5
            const collateralExposureData = row.original.collateral_exposure ?? [];
            const filteredCollateralExposureData = collateralExposureData?.filter((tokenAddress: `0x${string}`) => {
                const token = allTokensData[row.original.chain_id]?.find(
                    (asset: any) =>
                        asset?.address?.toLowerCase() ===
                        tokenAddress?.toLowerCase()
                ) ?? null
                return !!token?.name
            })

            const tokenImages = filteredCollateralExposureData?.map(
                (tokenAddress: `0x${string}`) =>
                    allTokensData[row.original.chain_id]?.find(
                        (asset: any) =>
                            asset?.address?.toLowerCase() ===
                            tokenAddress?.toLowerCase()
                    )?.logo ?? null
            )

            const tokenDetails = filteredCollateralExposureData?.map(
                (tokenAddress: `0x${string}`) => {
                    const token = allTokensData[row.original.chain_id]?.find(
                        (asset: any) =>
                            asset?.address?.toLowerCase() ===
                            tokenAddress?.toLowerCase()
                    )
                    return {
                        name: token?.name,
                        logo: token?.logo,
                    }
                }
            )

            const moreItemsData = tokenDetails?.filter((_, index) => index > MAX_ITEMS_TO_SHOW - 1)

            return (
                <AvatarCircles
                    avatarUrls={
                        tokenImages ?? []
                    }
                    avatarDetails={tokenDetails?.map(
                        (token) => ({
                            content: token.name,
                        })
                    )}
                    showMoreItemsTooltip={moreItemsData.length > 0}
                    maxItemsToShow={MAX_ITEMS_TO_SHOW}
                    moreItemsTooltipContent={
                        <ScrollArea type="always" className={`${moreItemsData.length > 5 ? 'h-[200px]' : 'h-[50px]'} w-full rounded-md p-0 pr-6`}>
                            <div className="flex flex-col gap-2">
                                {moreItemsData
                                    .filter((token) => !!token && !!token.name)
                                    .map((token: any) => (
                                        <div className="flex items-center gap-2">
                                            <ImageWithDefault
                                                src={token.logo}
                                                width={16}
                                                height={16}
                                                alt={token.name}
                                                className="rounded-full shrink-0"
                                            />
                                            <BodyText level="body2" weight="medium">
                                                {token.name}
                                            </BodyText>
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    }
                />
            )
        },
        enableGlobalFilter: false,
        enableSorting: false,
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
    // {
    //     accessorKey: 'utilization',
    //     accessorFn: (item) => Number(item.utilization),
    //     header: () => (
    //         <InfoTooltip
    //             side="bottom"
    //             label={<TooltipText>Utilization</TooltipText>}
    //             content={
    //                 'Ratio between the amount borrowed and the amount deposited.'
    //             }
    //         />
    //     ),
    //     cell: ({ row }) => {
    //         const isMorpho =
    //             row.original.platformId.split('-')[0].toLowerCase() ===
    //             PlatformType.MORPHO
    //         const isVault = row.original.isVault

    //         if (isMorpho && isVault) {
    //             return (
    //                 <InfoTooltip
    //                     label={<Badge>N/A</Badge>}
    //                     content="This does not apply to Morpho vaults, as the curator maintains this."
    //                 />
    //             )
    //         }

    //         if (`${Number(row.getValue('utilization')).toFixed(1)}` === '0.0') {
    //             return (
    //                 <InfoTooltip
    //                     label={
    //                         <TooltipText>
    //                             <BodyText level={'body2'} weight={'medium'}>
    //                                 {`${Number(row.getValue('utilization')).toFixed(1)}%`}
    //                             </BodyText>
    //                         </TooltipText>
    //                     }
    //                     content={'This asset is non-borrowable'}
    //                 />
    //             )
    //         }

    //         return (
    //             <BodyText level={'body2'} weight={'medium'}>
    //                 {`${Number(row.getValue('utilization')).toFixed(2)}%`}
    //             </BodyText>
    //         )
    //     },
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
 * Get apple farm APY breakdown tooltip content
 * @param baseAPY
 * @param appleFarmAPR
 * @param totalAPY
 * @returns apple farm APY breakdown tooltip content
 */
function getAppleFarmAPYTooltipContent({
    baseAPY,
    appleFarmAPR,
    totalAPY,
}: {
    baseAPY: number
    appleFarmAPR: number
    totalAPY: number
}) {
    return (
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText
                level="body1"
                weight="medium"
                className="py-2 text-gray-800"
            >
                APY Breakdown
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
                    {abbreviateNumber(baseAPY)}%
                </BodyText>
            </div>
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
                    <Label weight="medium" className="text-gray-800">
                        Apple Farm APR
                    </Label>
                </div>
                <BodyText
                    level="body3"
                    weight="medium"
                    className="text-gray-800"
                >
                    + {abbreviateNumber(appleFarmAPR)}%
                </BodyText>
            </div>
            <div
                className="flex items-center justify-between gap-[70px] py-2"
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
                    = {abbreviateNumber(totalAPY)}%
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
