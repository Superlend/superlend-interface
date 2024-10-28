"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import ImageWithDefault from "@/components/ImageWithDefault";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import { BodyText, Label } from "@/components/ui/typography";
import { OpportunitiesContext } from "@/context/opportunities-provider";
import useDimensions from "@/hooks/useDimensions";
import { abbreviateNumber, capitalizeText, containsNegativeInteger, convertNegativeToPositive, getPlatformVersion } from "@/lib/utils";
import { TOpportunityTable } from "@/types";
import { PlatformLogo } from "@/types/platform";
import { ColumnDef } from "@tanstack/react-table";
import { Percent } from "lucide-react";
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
                        <span className="truncate block shrink-0 hover:text-secondary-500">
                            {tokenSymbol}
                        </span>
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
                    <span className="truncate">{`${capitalizeText(platformName)} ${platformVersion}`}</span>
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
            let morphoReward = "";
            let morphoRewardFormatted = "";
            const hasRewards = row.original?.rewards && row.original?.rewards.length > 0;
            
            if (hasRewards) {
                morphoReward = abbreviateNumber(apyCurrent - Number(row.original?.rewards[0]?.supply_apy || 0));
                morphoRewardFormatted = Number(morphoReward) < 0.01 ? "<0.01" : morphoReward;
            }

            if (!apyCurrent) {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>{`${apyCurrentFormatted}%`}</TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return (
                <span className="flex items-center gap-1" >
                    <span className="">{`${apyCurrentFormatted}%`}</span>
                    {
                        hasRewards && (
                            <InfoTooltip
                                label={
                                    <img src="/icons/sparkles.svg" width={22} height={22} className="cursor-pointer hover:scale-110" />
                                }
                                content={
                                    <span className="flex flex-col gap-3">
                                        <span className="flex items-center justify-between gap-6">
                                            <span className="flex items-center gap-1">
                                                <Percent className="w-[16px] h-[16px]" />
                                                <Label weight="normal">Rate</Label>
                                            </span>
                                            <BodyText level="body2" weight="medium">
                                                + {abbreviateNumber(apyCurrent)}%
                                            </BodyText>
                                        </span>
                                        <span className="flex items-center justify-between gap-6">
                                            <span className="flex items-center gap-1">
                                                <ImageWithDefault src={PlatformLogo.MORPHO} width={16} height={16} className="cursor-pointer hover:scale-110" />
                                                <Label weight="normal">Morpho</Label>
                                            </span>
                                            <BodyText level="body2" weight="medium">
                                                + {morphoRewardFormatted}
                                            </BodyText>
                                        </span>
                                        <span className="flex items-center justify-between gap-6">
                                            <span className="flex items-center gap-1">
                                                <ImageWithDefault src="/icons/sparkles.svg" width={16} height={16} className="cursor-pointer hover:scale-110" />
                                                <Label weight="normal">Net APY</Label>
                                            </span>
                                            <BodyText level="body2" weight="medium">
                                                = {abbreviateNumber(apyCurrent)}%
                                            </BodyText>
                                        </span>
                                    </span>
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
                        <span>
                            {`${Number(row.getValue("max_ltv")).toFixed(2)}%`}
                        </span>}
                    {Number(row.getValue("max_ltv")) === 0 &&
                        <InfoTooltip
                            label={<TooltipText>{`${row.getValue("max_ltv")}%`}</TooltipText>}
                            content="This asset cannot be used as collateral to take out a loan"
                        />}
                </span>
            )
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "deposits",
        accessorFn: item => Number(item.deposits),
        header: () => (
            <InfoTooltip
                label={
                    <TooltipText>Deposits</TooltipText>
                }
                content={"Total amount of asset deposited in the pool as collateral so far."}
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue("deposits");
            if (containsNegativeInteger(value)) {
                return `-$${abbreviateNumber(Number(convertNegativeToPositive(value)))}`
            }
            return `$${abbreviateNumber(Number(value))}`
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "borrows",
        accessorFn: item => Number(item.borrows),
        header: () => (
            <InfoTooltip
                label={
                    <TooltipText>Borrows</TooltipText>
                }
                content={"Total amount of asset borrowed from the pool."}
            />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue("borrows");
            if (containsNegativeInteger(value)) {
                return `-$${abbreviateNumber(Number(convertNegativeToPositive(value)))}`
            }
            return `$${abbreviateNumber(Number(value))}`
        },
        // enableGlobalFilter: false,
    },
    {
        accessorKey: "utilization",
        accessorFn: item => Number(item.utilization),
        header: () => (
            <InfoTooltip
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
                            <TooltipText>{`${Number(row.getValue("utilization")).toFixed(1)}%`}</TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return `${Number(row.getValue("utilization")).toFixed(2)}%`
        },
        // enableGlobalFilter: false,
    },
]

function TooltipText({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block border-b border-dashed border-gray-800">
            {children}
        </span>
    )
}