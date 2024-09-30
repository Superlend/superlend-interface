"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import ImageWithDefault from "@/components/ImageWithDefault";
import InfoTooltip from "@/components/tooltips/InfoTooltip";
import { BodyText, Label } from "@/components/ui/typography";
import { abbreviateNumber, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import { TOpportunityTable } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

function getPositionManagementParams(tokenSymbol: string, chain_id: string, platform_id: string) {
    return `/position-management?tokenSymbol=${tokenSymbol}&chain_id=${chain_id}&platform_id=${platform_id}`;
}

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: "tokenSymbol",
        header: "Token",
        accessorFn: item => item.tokenSymbol,
        cell: ({ row }) => {
            const tokenSymbol: string = row.getValue("tokenSymbol");
            const tokenLogo = row.original.tokenLogo;
            const tokenAddress = row.original.tokenAddress;
            const chainId = row.original.chain_id;
            const chainLogo = row.original.chainLogo;
            const chainName= row.original.chainName;
            const platformId = row.original.platform_id;
            
            return (
                <InfoTooltip
                    label={
                        <span className="flex items-center gap-[8px] w-fit">
                            <ImageWithBadge
                                mainImg={tokenLogo}
                                badgeImg={chainLogo}
                            />
                            <Link href={{
                                pathname: "position-management",
                                query: {
                                    token: tokenAddress,
                                    chain_id: chainId,
                                    platform_id: platformId,
                                }
                            }}
                                className="truncate border-b border-dashed border-gray-800 hover:border-transparent">
                                <span className="shrink-0">
                                    {tokenSymbol}
                                </span>
                            </Link>
                        </span>
                    }

                    content={
                        <span className="flex flex-col gap-[16px]">
                            <span className="flex flex-col gap-[4px]">
                                <Label>Token</Label>
                                <span className="flex items-center gap-[8px]">
                                    <ImageWithDefault alt={tokenSymbol} src={tokenLogo} width={24} height={24} />
                                    <BodyText level="body2" weight="medium">{tokenSymbol}</BodyText>
                                </span>
                            </span>
                            <span className="flex flex-col gap-[4px]">
                                <Label>Chain</Label>
                                <span className="flex items-center gap-[8px]">
                                    <ImageWithDefault alt={chainName} src={chainLogo} width={24} height={24} />
                                    <BodyText level="body2" weight="medium">{chainName}</BodyText>
                                </span>
                            </span>
                        </span>
                    }
                />
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

            return (
                <span className="flex items-center gap-[8px]">
                    <img
                        src={row.original.platformLogo || '/images/logos/favicon-32x32.png'}
                        alt={row.original.platformName}
                        width={20}
                        height={20} />
                    <span className="truncate">{`${platformName[0]}${platformName.slice(1).toLowerCase()}`}</span>
                </span>
            )
        },
        enableSorting: false,
    },
    {
        accessorFn: item => `${Number(item.apy_current).toFixed(1)}%`,
        header: "APY",
        // enableGlobalFilter: false,
    },
    {
        accessorFn: item => `${Number(item.max_ltv).toFixed(0)}%`,
        header: "Max LTV",
        // enableGlobalFilter: false,
    },
    {
        accessorFn: item => {
            const value = item.utilization;
            if (containsNegativeInteger(value)) {
                return `-$${abbreviateNumber(Number(convertNegativeToPositive(value)))}`
            }
            return `$${abbreviateNumber(Number(value))}`
        },
        header: "Deposits",
        // enableGlobalFilter: false,
    },
    {
        accessorFn: item => `${Number(item.utilization).toFixed(1)}%`,
        header: "Utilization",
        // enableGlobalFilter: false,
    },
]