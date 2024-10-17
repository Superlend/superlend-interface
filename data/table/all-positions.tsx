"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import ImageWithDefault from "@/components/ImageWithDefault";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import TooltipText from "@/components/tooltips/TooltipText";
import { BodyText, Label } from "@/components/ui/typography";
import useDimensions from "@/hooks/useDimensions";
import { abbreviateNumber, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

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
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    tokenLogo: string;
    chain_id: number;
    chainName: string;
    chainLogo: string;
    platform_id: string;
    platformName: string;
    platformLogo: string;
    apy: number;
    deposits: string;
    borrows: string;
    earnings: number;
};

export const columns: ColumnDef<TPositionsTable>[] = [
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
            const platformId = row.original.platform_id;
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
                            platform_id: platformId,
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
            const platformVersion: string = row.original.platform_id.split("-")[1]

            return (
                <span className="flex items-center gap-[8px]">
                    <img
                        src={row.original.platformLogo || '/images/logos/favicon-32x32.png'}
                        alt={row.original.platformName}
                        width={20}
                        height={20} />
                    <span className="truncate">{`${platformName[0]}${platformName.slice(1).toLowerCase()} ${platformVersion}`}</span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: "apy",
        accessorFn: item => Number(item.apy),
        header: "APY",
        cell: ({ row }) => {
            if (`${Number(row.getValue("apy")).toFixed(2)}` === "0.00") {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>{`${Number(row.getValue("apy")).toFixed(2)}%`}</TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return `${Number(row.getValue("apy")).toFixed(2)}%`
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
        accessorKey: "earnings",
        accessorFn: item => Number(item.earnings),
        header: () => (
            <InfoTooltip
                label={
                    <TooltipText>Earnings</TooltipText>
                }
                content={"Ratio between the amount borrowed and the amount deposited."}
            />
        ),
        cell: ({ row }) => {
            if (`${Number(row.getValue("earnings")).toFixed(1)}` === "0.0") {
                return (
                    <InfoTooltip
                        label={
                            <TooltipText>{`${Number(row.getValue("earnings")).toFixed(1)}%`}</TooltipText>
                        }
                        content={"This asset is non-borrowable"}
                    />

                )
            }

            return `${Number(row.getValue("earnings")).toFixed(2)}%`
        },
        // enableGlobalFilter: false,
    },
]
