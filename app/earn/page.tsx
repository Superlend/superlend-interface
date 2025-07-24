'use client'

import ExternalLink from "@/components/ExternalLink";
import ImageWithBadge from "@/components/ImageWithBadge";
import MainContainer from "@/components/MainContainer";
import StackedIcons from "@/components/StackedIcons";
import AvatarCircles from "@/components/ui/avatar-circles";
import { DataTable } from "@/components/ui/data-table";
import { BodyText } from "@/components/ui/typography";
import { useState } from "react";

const data = [
    {
        strategy: 'USDC',
        platform: 'Aave',
        max_apy: 100,
        available_liquidity: 100,
        token: {
            logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
            name: 'USDC',
            symbol: 'USDC',
        },
        chain: {
            logo: '/images/chains/base.webp',
            name: 'Base',
        },
        isPair: false,
        href: 'https://funds.superlend.xyz/super-fund/base',
        platforms: [
            {
                src: '/images/platforms/aave.webp',
                alt: 'Aave',
            },
            {
                src: '/images/platforms/morpho.webp',
                alt: 'Morpho',
            },
            {
                src: '/images/platforms/euler.webp',
                alt: 'Euler',
            },
        ]
    },
    {
        strategy: 'stXTZ/XTZ',
        platform: 'Aave',
        max_apy: 100,
        available_liquidity: 100,
        token1: {
            logo: '/images/tokens/xtz.png',
            name: 'stXTZ',
            symbol: 'stXTZ',
        },
        token2: {
            logo: '/images/tokens/xtz.png',
            name: 'XTZ',
            symbol: 'XTZ',
        },
        isPair: true,
        href: '',
        platforms: [
            {
                src: '/images/platforms/aave.webp',
                alt: 'Aave',
            },
        ]
    },
]

const columns = [
    {
        header: 'Strategy',
        accessorKey: 'strategy',
        cell: ({ row }: { row: any }) => {
            const token = row.original.token
            const token1 = row.original.token1
            const token2 = row.original.token2
            const chain = row.original.chain
            const isPair = row.original.isPair

            return <div className="flex items-center gap-2">
                {!isPair &&
                    <ImageWithBadge
                        mainImg={token.logo || ''}
                        badgeImg={chain.logo || ''}
                        mainImgAlt={`${token.symbol} token logo`}
                        badgeImgAlt={`${chain.name} chain logo`}
                    />
                }
                {isPair &&
                    <StackedIcons
                        list={[{
                            id: 'token1',
                            src: token1.logo || '',
                            alt: `${token1.symbol} token logo`,
                        }, {
                            id: 'token2',
                            src: token2.logo || '',
                            alt: `${token2.symbol} token logo`,
                        }]}
                    />
                }
                {isPair &&
                    <BodyText level="body2" weight="medium">
                        {token1.name} / {token2.name}
                    </BodyText>
                }
                {!isPair &&
                    <BodyText level="body2" weight="medium">
                        {token.name}
                    </BodyText>
                }
            </div>
        }
    },
    {
        header: 'Platform',
        accessorKey: 'platform',
        cell: ({ row }: { row: any }) => {
            const platforms = row.original.platforms ?? []
            const platformImages = platforms.map((platform: any) => platform.src)
            const platformDetails = platforms.map((platform: any) => ({
                content: platform.alt,
            }))

            return (
                <AvatarCircles
                    avatarUrls={
                        platformImages ?? []
                    }
                    avatarDetails={
                        platformDetails ?? []
                    }
                />
            )
        },
        enableSorting: false,
    },
    {
        header: 'Max APY',
        accessorKey: 'max_apy',
    },
    {
        header: 'Available Liquidity',
        accessorKey: 'available_liquidity',
    },
    {
        header: '',
        accessorKey: 'action',
        cell: ({ row }: { row: any }) => {
            const href = row.original.href

            return (
                <ExternalLink href={href} className="gap-1">
                    Visit
                </ExternalLink>
            )
        },
        enableSorting: false,
    }
]

export default function EarnPage() {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })

    return (
        <MainContainer>
            <DataTable
                columns={columns}
                data={data}
                pagination={pagination}
                setPagination={setPagination}
                totalPages={Math.ceil(data.length / 10)}
                filters={''}
                setFilters={() => { }}
            />
        </MainContainer>
    )
}