"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import ImageWithDefault from "@/components/ImageWithDefault";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import { BodyText, Label } from "@/components/ui/typography";
import { OpportunitiesContext } from "@/context/opportunities-provider";
import useDimensions from "@/hooks/useDimensions";
import { abbreviateNumber, capitalizeText, containsNegativeInteger, convertNegativeToPositive, getPlatformVersion } from "@/lib/utils";
import { TOpportunityTable, TReward } from "@/types";
import { PlatformLogo } from "@/types/platform";
import { ColumnDef } from "@tanstack/react-table";
import { ChartNoAxesColumnIncreasing, Percent } from "lucide-react";
import Link from "next/link";
import { useContext } from "react";

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: "tokenSymbol",
        header: "Token",
        accessorFn: item => item.tokenSymbol,
        cell: ({ row }) => {
            const { width: screenWidth } = useDimensions();
            const tokenSymbol: string = row.getValue("tokenSymbol");
            const tokenLogo = row.original.tokenLogo;
            const tokenAddress = row.original.tokenAddress;
            const tokenName = row.original.tokenName;
            const chainId = row.original.chain_id;
            const chainLogo = row.original.chainLogo;
            const chainName = row.original.chainName;
            const platformId = row.original.protocol_identifier;
            const tooltipContent = (
                <span className="flex flex-col gap-[16px]">
                    <span className="flex flex-col gap-[4px]">
                        <Label>Token</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault alt={tokenSymbol} src={tokenLogo} width={24} height={24} className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]" />
                            <BodyText level="body2" weight="medium">{tokenName}</BodyText>
                        </span>
                    </span>
                    <span className="flex flex-col gap-[4px]">
                        <Label>Chain</Label>
                        <span className="flex items-center gap-[8px]">
                            <ImageWithDefault alt={chainName} src={chainLogo} width={24} height={24} className="w-[24px] h-[24px] max-w-[24px] max-h-[24px]" />
                            <BodyText level="body2" weight="medium">{chainName[0]}{chainName.toLowerCase().slice(1)}</BodyText>
                        </span>
                    </span>
                </span>
            )

            return (
                <span className="flex items-center gap-[8px] w-fit max-w-full">
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
                    <Link href={{
                        pathname: "position-management",
                        query: {
                            token: tokenAddress,
                            chain_id: chainId,
                            protocol_identifier: platformId,
                        }
                    }}
                        className="truncate">
                        <BodyText level={"body2"} weight={"semibold"} className="truncate block shrink-0 hover:text-secondary-500">
                            {tokenSymbol}
                        </BodyText>

                    </Link>
                    {/* <InfoTooltip iconWidth={16} iconHeight={16} content={tooltipContent} /> */}
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "platformName",
        header: "Platform",
        accessorFn: item => item.platformName,
        cell: ({ row }) => {
            const platformName: string = row.getValue("platformName");
            const platformVersion = getPlatformVersion(platformName);

            return (
                <span className="flex items-center gap-[8px]">
                    <img
                        src={row.original.platformLogo || '/images/logos/favicon-32x32.png'}
                        alt={row.original.platformName}
                        width={20}
                        height={20} />
                    <BodyText level={"body2"} weight={"semibold"} className="truncate">
                        {`${capitalizeText(platformName)} ${platformVersion}`}
                    </BodyText>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "apy_current",
        accessorFn: item => Number(item.apy_current),
        header: () => {
            const { positionType } = useContext<any>(OpportunitiesContext);
            const lendTooltipContent = "% interest you earn on deposits over a year. This includes compounding.";
            const borrowTooltipContent = "% interest you pay for your borrows over a year. This includes compunding.";
            const tooltipContent = positionType === "lend" ? lendTooltipContent : borrowTooltipContent;
            return (
                <InfoTooltip
                    side="bottom"
                    label={
                        <TooltipText>APY</TooltipText>
                    }
                    content={tooltipContent}
                />
            )
        },
        cell: ({ row }) => {
            const apyCurrent = Number(row.getValue("apy_current"));
            const apyCurrentFormatted = apyCurrent.toFixed(2);
            const hasRewards = row.original?.rewards && row.original?.rewards.length > 0;
            // Declare tooltip content related variables
            let baseRate, baseRateFormatted, rewards, totalRewards, rewardFormatted;

            if (hasRewards) {
                // Update rewards grouped by asset address
                rewards = getRewardsGroupedByAsset(row.original?.rewards)
                // Get total rewards
                totalRewards = rewards.reduce((acc, curr) => acc + Number(curr.supply_apy), 0);
                // Base rate = APY - Asset Total Rewards
                baseRate = abbreviateNumber(apyCurrent - totalRewards);
                baseRateFormatted = Number(baseRate) < 0.01 ? "<0.01" : baseRate;
            }

            if (!apyCurrent) {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>
                                <BodyText level={"body2"} weight={"semibold"}>
                                    {`${apyCurrentFormatted}%`}
                                </BodyText>
                            </TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return (
                <span className="flex items-center gap-1" >
                    <BodyText level={"body2"} weight={"semibold"}>
                        {`${apyCurrentFormatted}%`}
                    </BodyText>
                    {
                        hasRewards && (
                            <InfoTooltip
                                label={
                                    <ImageWithDefault src="/icons/sparkles.svg" width={22} height={22} className="cursor-pointer hover:scale-110" />
                                }
                                content={
                                    getRewardsTooltipContent({ baseRateFormatted: baseRateFormatted || '', rewards: rewards || [], apyCurrent: apyCurrent || 0 })
                                }
                            />
                        )
                    }
                </span >
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "max_ltv",
        accessorFn: item => Number(item.max_ltv),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={
                    <TooltipText>Max LTV</TooltipText>
                }
                content={"Maximum amount that can be borrowed against the value of collateral."}
            />
        ),
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-2">
                    {Number(row.getValue("max_ltv")) > 0 &&
                        <BodyText level={"body2"} weight={"semibold"}>
                            {`${Number(row.getValue("max_ltv")).toFixed(2)}%`}
                        </BodyText>}
                    {Number(row.getValue("max_ltv")) === 0 &&
                        <InfoTooltip
                            label={<TooltipText>
                                <BodyText level={"body2"} weight={"semibold"}>
                                    {`${row.getValue("max_ltv")}%`}
                                </BodyText>
                            </TooltipText>}
                            content="This asset cannot be used as collateral to take out a loan"
                        />}
                </span>
            )
        },
        size: 150,
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "deposits",
        accessorFn: item => Number(item.deposits),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={
                    <TooltipText>Deposits</TooltipText>
                }
                content={"Total amount of asset deposited in the pool as collateral so far."}
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue("deposits");
            if (containsNegativeInteger(value)) {
                return (
                    <BodyText level={"body2"} weight={"semibold"}>
                        -${abbreviateNumber(Number(convertNegativeToPositive(value)))}
                    </BodyText>
                )
            }
            return (
                <BodyText level={"body2"} weight={"semibold"}>
                    ${abbreviateNumber(Number(value))}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "borrows",
        accessorFn: item => Number(item.borrows),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={
                    <TooltipText>Borrows</TooltipText>
                }
                content={"Total amount of asset borrowed from the pool."}
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue("borrows");
            if (containsNegativeInteger(value)) {
                return (
                    <BodyText level={"body2"} weight={"semibold"}>
                        -${abbreviateNumber(Number(convertNegativeToPositive(value)))}
                    </BodyText>
                )
            }
            return (
                <BodyText level={"body2"} weight={"semibold"}>
                    ${abbreviateNumber(Number(value))}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "utilization",
        accessorFn: item => Number(item.utilization),
        header: () => (
            <InfoTooltip
                side="bottom"
                label={
                    <TooltipText>Utilization</TooltipText>
                }
                content={"Ratio between the amount borrowed and the amount deposited."}
            />
        ),
        cell: ({ row }) => {
            if (`${Number(row.getValue("utilization")).toFixed(1)}` === "0.0") {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>
                                <BodyText level={"body2"} weight={"semibold"}>
                                    {`${Number(row.getValue("utilization")).toFixed(1)}%`}
                                </BodyText>
                            </TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return (
                <BodyText level={"body2"} weight={"semibold"}>
                    {`${Number(row.getValue("utilization")).toFixed(2)}%`}
                </BodyText>
            )
        },
        // enableGlobalFilter: false,
    },
]

function TooltipText({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-block border-b border-dashed border-gray-800 ${className}`}>
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
        const existing = acc.find(item => item.asset.address === curr.asset.address);
        if (existing) {
            existing.supply_apy += curr.supply_apy;
        } else {
            acc.push(curr);
        }
        return acc;
    }, []);
}

/**
 * Get rewards tooltip content
 * @param baseRateFormatted 
 * @param rewards 
 * @param apyCurrent 
 * @returns rewards tooltip content
 */
function getRewardsTooltipContent({ baseRateFormatted, rewards, apyCurrent }: { baseRateFormatted: string, rewards: TReward[], apyCurrent: number }) {
    return (
        <div className="flex flex-col divide-y divide-gray-800">
            <BodyText level="body1" weight="medium" className="py-2 text-gray-800/75">Rate & Rewards</BodyText>
            <div className="flex items-center justify-between gap-[100px] py-2" style={{ gap: '70px' }}>
                <div className="flex items-center gap-1">
                    <ChartNoAxesColumnIncreasing className="w-[16px] h-[16px] text-gray-800" />
                    <Label weight="medium" className="text-gray-800">Base rate</Label>
                </div>
                <BodyText level="body3" weight="medium" className="text-gray-800">
                    {baseRateFormatted}%
                </BodyText>
            </div>
            {
                rewards?.map((reward: TReward) => (
                    <div key={reward.asset.address} className="flex items-center justify-between gap-[100px] py-2" style={{ gap: '70px' }}>
                        <div className="flex items-center gap-1">
                            <ImageWithDefault src={reward.asset.logo} width={16} height={16} className="inline-block rounded-full object-contain" />
                            <Label weight="medium" className="truncate text-gray-800 max-w-[100px] truncate" title={reward.asset.name}>
                                {reward.asset.name}
                            </Label>
                        </div>
                        <BodyText level="body3" weight="medium" className="text-gray-800">
                            + {abbreviateNumber(reward.supply_apy)}%
                        </BodyText>
                    </div>
                ))
            }
            <div className="flex items-center justify-between gap-[100px] py-2" style={{ gap: '70px' }}>
                <div className="flex items-center gap-1">
                    <ImageWithDefault src="/icons/sparkles.svg" width={16} height={16} className="inline-block" />
                    <Label weight="medium" className="text-gray-800">Net APY</Label>
                </div>
                <BodyText level="body3" weight="medium" className="text-gray-800">
                    = {abbreviateNumber(apyCurrent)}%
                </BodyText>
            </div>
        </div>
    )
}
