"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type TOpportunity = {
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

export const columns: ColumnDef<TOpportunity>[] = [
    {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-1">
                    <ImageWithBadge
                        mainImg={row.original.token_image}
                        badgeImg={row.original.chain_image}
                    />
                    <span className="font-medium">
                        <Link href="position-management">{row.original.token}</Link>
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
                <span className="flex items-center gap-1">
                    <img src={row.original.platform_image} alt={row.original.platform} width={20} height={20} />
                    <span className="font-medium">{row.original.platform}</span>
                </span>
            )
        }
    },
    {
        accessorKey: "apy",
        header: "APY",
    },
    {
        accessorKey: "max_ltv",
        header: "Max LTV",
    },
    {
        accessorKey: "deposits",
        header: "Deposits",
    },
    {
        accessorKey: "utilization",
        header: "Utilization",
    },
]
