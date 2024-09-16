"use client"

import ImageWithBadge from "@/components/ImageWithBadge";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/typography";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
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

export const columns: ColumnDef<TPositions>[] = [
    {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-1">
                    <ImageWithBadge
                        mainImg={row.original.platform_image}
                        badgeImg={row.original.chain_image}
                    />
                    <span className="font-medium">
                        <Link href="position-management">{row.original.platform}</Link>
                    </span>
                </span>
            )
        }
    },
    {
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) => {
            return (
                <span className="flex items-center gap-1">
                    <img src={row.original.token_image} alt={row.original.token} width={20} height={20} />
                    <span className="font-medium">{row.original.deposits}</span>
                </span>
            )
        }
    },
    {
        accessorKey: "apy",
        header: "APY",
    },
    {
        accessorKey: "deposits",
        header: "Deposits",
    },
    {
        accessorKey: "earnings",
        header: "Earnings",
        cell: ({ row }) => {
            return (
                <Badge variant="green">
                    <Label weight="medium">{row.original.deposits}</Label>
                </Badge>
            )
        }
    },
]
