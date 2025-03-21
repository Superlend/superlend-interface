"use client"

import React, { useEffect } from 'react'
import { Label } from './ui/typography'
import { useShowAllMarkets } from '@/context/show-all-markets-provider'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import Image from 'next/image'

export default function MarketsBanner() {
    const { showAllMarkets, toggleShowAllMarkets, isLoading } = useShowAllMarkets()
    const pathname = usePathname()

    // Don't render anything while loading
    if (isLoading) {
        return null
    }

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
            icon: <Globe className="w-4 h-4" />
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
            className="w-full"
        >
            <div className="max-w-[1200px] mx-auto">
                <div className="mx-5 mb-6">
                    <div className="flex gap-4 w-full">
                        {tabs.map((tab, index) => (
                            <motion.button
                                key={tab.id}
                                onClick={() => toggleShowAllMarkets(tab.id === 'all-markets')}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={cn(
                                    "flex-1 group relative px-5 py-4 bg-white bg-opacity-40 backdrop-blur-md rounded-[16px] border transition-all duration-300 hover:shadow-lg",
                                    tab.isActive 
                                        ? "border-secondary-500 shadow-lg" 
                                        : "border-white border-opacity-40 hover:border-secondary-300"
                                )}
                            >
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "transition-colors duration-300",
                                            tab.isActive ? "text-gray-800" : "text-gray-600 group-hover:text-gray-700 grayscale"
                                        )}>
                                            {tab.icon}
                                        </span>
                                        <Label 
                                            weight="medium" 
                                            className={cn(
                                                "text-[15px] leading-tight transition-colors duration-300",
                                                tab.isActive ? "text-gray-800" : "text-gray-600 group-hover:text-gray-700"
                                            )}
                                        >
                                            {tab.title}
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {tab.stats.map((stat, i) => (
                                            <React.Fragment key={i}>
                                                <Label 
                                                    className={cn(
                                                        "text-xs transition-colors duration-300",
                                                        tab.isActive ? "text-gray-600" : "text-gray-500 group-hover:text-gray-600"
                                                    )}
                                                    weight="medium"
                                                >
                                                    {stat}
                                                </Label>
                                                {i < tab.stats.length - 1 && (
                                                    <span className="w-1 h-1 rounded-full bg-gray-500"/>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                {tab.isActive && (
                                    <motion.div
                                        layoutId="active-tab"
                                        className="absolute inset-0 border-2 border-secondary-500 rounded-[16px]"
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
} 