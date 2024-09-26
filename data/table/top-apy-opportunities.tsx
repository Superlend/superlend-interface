"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import { abbreviateNumber, containsNegativeInteger, convertNegativeToPositive } from "@/lib/utils";
import { TOpportunityTable } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const columns: ColumnDef<TOpportunityTable>[] = [
    {
        accessorKey: "tokenSymbol",
        header: "Token",
        accessorFn: item => item.tokenSymbol,
        cell: ({ row }) => {
            const tokenSymbol: string = row.getValue("tokenSymbol");
            return (
                <span className="flex items-center gap-[8px]">
                    <ImageWithBadge
                        mainImg={row.original.tokenLogo}
                        badgeImg={row.original.chainLogo}
                    />
                    <Link href="position-management" className="truncate">
                        <span className="shrink-0 ">
                            {tokenSymbol}
                        </span>
                    </Link>
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