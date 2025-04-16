"use client"

import React, { useEffect } from 'react'
import { Label } from './ui/typography'
import { useShowAllMarkets } from '@/context/show-all-markets-provider'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from './ui/skeleton'

export default function MarketsBanner() {
    const { showAllMarkets, toggleShowAllMarkets, isLoading } = useShowAllMarkets()
    const pathname = usePathname()

    // Only show banner on discover or etherlink routes
    if (pathname !== '/discover' && pathname !== '/etherlink') {
        return null
    }

    const tabs = [
        {
            id: 'all-markets',
            title: 'All Markets',
            stats: ['350+ Markets', '15+ Chains'],
            isActive: showAllMarkets,
            icon: <Globe className="w-4 h-4 text-inherit" />
        },
        {
            id: 'etherlink',
            title: 'Etherlink Only',
            stats: ['$3M In Rewards'],
            isActive: !showAllMarkets,
            icon: <Image src="/images/logos/apple-green.png" alt="Etherlink" width={16} height={16} />
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-md:sticky max-md:top-20 max-md:z-50"
        >
            <div className="max-w-[1200px] mx-auto">
                <div className="mx-5 mb-6">
                    {isLoading &&
                        <div className="flex gap-4 w-full">
                            <Skeleton className="h-[77px] flex-1 rounded-4" />
                            <Skeleton className="h-[77px] flex-1 rounded-4" />
                        </div>
                    }
                    {!isLoading &&
                        <div className="flex gap-4 w-full bg-white bg-opacity-40 backdrop-blur-md rounded-4 md:rounded-5 p-2">
                            {tabs.map((tab, index) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => toggleShowAllMarkets(tab.id === 'all-markets')}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={cn(
                                        "flex-1 group relative p-2 md:px-5 md:py-4 rounded-4 md:rounded-5 transition-all duration-300",
                                        tab.isActive
                                            ? "bg-primary backdrop-blur-md shadow-lg"
                                            : "bg-white bg-opacity-0 hover:bg-opacity-40"
                                    )}
                                >
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex items-start gap-1">
                                            <span className={cn(
                                                "transition-colors duration-300",
                                                tab.isActive ? "text-white" : "text-gray-600 group-hover:text-gray-700 grayscale group-hover:grayscale-0"
                                            )}>
                                                {tab.icon}
                                            </span>
                                            <Label
                                                weight="medium"
                                                className={cn(
                                                    "text-[15px] leading-tight transition-colors duration-300",
                                                    tab.isActive ? "text-white" : "text-gray-600 group-hover:text-gray-700"
                                                )}
                                            >
                                                {tab.title}
                                            </Label>
                                        </div>
                                        <div className="hidden md:flex flex-wrap items-center justify-center gap-1">
                                            {tab.stats.map((stat, i) => (
                                                <React.Fragment key={i}>
                                                    <Label
                                                        className={cn(
                                                            "text-xs transition-colors duration-300",
                                                            tab.isActive ? "text-white/80" : "text-gray-500 group-hover:text-gray-600"
                                                        )}
                                                        weight="medium"
                                                    >
                                                        {stat}
                                                    </Label>
                                                    {i < tab.stats.length - 1 && (
                                                        <span className="hidden md:block w-1 h-1 rounded-full bg-gray-300" />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    }
                </div>
            </div>
        </motion.div>
    )
} 