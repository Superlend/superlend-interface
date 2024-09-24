"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import { TOpportunity } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

function containsNegativeInteger(str: string): boolean {
    // Regular expression to match negative integers
    const negativeIntegerPattern = /-\d+/;

    // Test the string against the pattern
    return negativeIntegerPattern.test(str);
}

function convertNegativeToPositive(str: string) {
    // Regular expression to match negative integers
    const negativeIntegerPattern = /(-\d+)/g;

    // Replace negative integers with their positive counterparts
    return str.toString().replace(negativeIntegerPattern, (match) => {
        return Math.abs(parseInt(match, 10)).toString();
    });
}

export const abbreviateNumber = (value: number) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(2) + 'B'
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K'
    } else {
      return value.toFixed(2).toString()
    }
  }

export const columns: ColumnDef<TOpportunity>[] = [
    {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-[6px] min-w-[150px]">
                    <ImageWithBadge
                        mainImg={row.original.token.logo}
                        badgeImg={row.original.chain.logo}
                    />
                    <span className="font-medium">
                        <Link href="position-management">{row.original.token.name}</Link>
                    </span>
                </span>
            )
        }
    },
    {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-[4px] min-w-[150px]">
                    <img
                        src={row.original.token.logo || '/images/logos/favicon-32x32.png'}
                        alt={row.original.platform.name}
                        width={20}
                        height={20} />
                    <span className="font-medium truncate">{row.original.platform.name}</span>
                </span>
            )
        }
    },
    {
        accessorFn: item => `${Number(item.platform.apy.current).toFixed(1)}%`,
        header: "APY",
    },
    {
        accessorFn: item => `${Number(item.platform.max_ltv).toFixed(0)}%`,
        header: "Max LTV",
    },
    {
        accessorFn: item => {
            const value = item.platform.liquidity;
            if (containsNegativeInteger(value)) {
                return `-$${abbreviateNumber(Number(convertNegativeToPositive(value)))}`
            }
            return `$${abbreviateNumber(Number(value))}`
        },
        header: "Deposits",
    },
    {
        accessorFn: item => `${Number(item.platform.utilization_rate).toFixed(1)}%`,
        header: "Utilization",
    },
]