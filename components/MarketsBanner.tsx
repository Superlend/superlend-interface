"use client"

import React, { useState } from 'react'
import { Label } from './ui/typography'
import { useShowAllMarkets } from '@/context/show-all-markets-provider'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, Globe } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from './ui/skeleton'

export default function MarketsBanner() {
    const { showAllMarkets, toggleShowAllMarkets, isLoading, activeMarket, setActiveMarket } = useShowAllMarkets()
    const pathname = usePathname()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    // Only show banner on discover, etherlink, or polygon routes
    if (pathname !== '/discover' && pathname !== '/etherlink' && pathname !== '/polygon') {
        return null
    }

    const tabs = [
        {
            id: 'all-markets',
            title: 'All Markets',
            stats: ['350+ Markets', '15+ Chains'],
            isActive: activeMarket === 'all-markets',
            icon: <Globe className="w-4 h-4 text-inherit" />
        },
        {
            id: 'etherlink',
            title: 'Etherlink Only',
            stats: ['$3M In Rewards'],
            isActive: activeMarket === 'etherlink',
            icon: <Image src="/images/logos/apple-green.png" alt="Etherlink chain logo" width={16} height={16} />
        },
        {
            id: 'polygon',
            title: 'Polygon Only',
            stats: ['100+ Markets'],
            isActive: activeMarket === 'polygon',
            icon: <Image src="https://superlend-assets.s3.ap-south-1.amazonaws.com/polygon.svg" alt="Polygon chain logo" width={16} height={16} className="rotate-[30deg] mt-0.5" />
        }
    ]

    const activeTab = tabs.find(tab => tab.isActive) || tabs[0]

    const handleTabSelection = (tabId: string) => {
        if (tabId === activeTab.id) return;
        
        if (tabId === 'all-markets') {
            toggleShowAllMarkets(true)
        } else {
            toggleShowAllMarkets(false, tabId as 'etherlink' | 'polygon')
        }
        
        setIsDropdownOpen(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-md:sticky max-md:top-20 max-md:z-50"
        >
            <div className="max-w-[1200px] mx-auto">
                <div className="mx-3 md:mx-5 mb-4 md:mb-6">
                    {isLoading &&
                        <div className="flex gap-2 w-full">
                            <Skeleton className="h-[60px] flex-1 rounded-4" />
                        </div>
                    }
                    {!isLoading && (
                        <>
                            {/* Mobile Dropdown (< 640px) */}
                            <div className="sm:hidden relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center justify-between w-full px-4 py-3 bg-white bg-opacity-40 backdrop-blur-md rounded-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={activeTab.isActive ? "text-primary" : "text-gray-600"}>
                                            {activeTab.icon}
                                        </span>
                                        <Label weight="medium" className="text-[15px]">{activeTab.title}</Label>
                                    </div>
                                    <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", 
                                        isDropdownOpen ? "transform rotate-180" : "")} />
                                </button>
                                
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-4 shadow-lg z-10">
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabSelection(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 transition-colors",
                                                    tab.id === activeTab.id ? "bg-gray-100" : ""
                                                )}
                                            >
                                                <span className={tab.isActive ? "text-primary" : "text-gray-600"}>
                                                    {tab.icon}
                                                </span>
                                                <Label weight="medium" className="text-[14px]">{tab.title}</Label>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Tablet and Desktop Tabs (>= 640px) */}
                            <div className="hidden sm:flex gap-2 md:gap-4 w-full bg-white bg-opacity-40 backdrop-blur-md rounded-4 md:rounded-5 p-1.5 md:p-2">
                                {tabs.map((tab, index) => (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => handleTabSelection(tab.id)}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className={cn(
                                            "flex-1 group relative flex items-center justify-center gap-3 px-3 py-3 md:px-5 md:py-4 rounded-4 md:rounded-5 transition-all duration-300",
                                            tab.isActive
                                                ? "bg-primary backdrop-blur-md shadow-lg"
                                                : "bg-white bg-opacity-0 hover:bg-opacity-40"
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={cn(
                                                "transition-colors duration-300",
                                                tab.isActive ? "text-white" : "text-gray-600 group-hover:text-gray-700 grayscale group-hover:grayscale-0"
                                            )}>
                                                {tab.icon}
                                            </span>
                                            <Label
                                                weight="medium"
                                                className={cn(
                                                    "text-[14px] md:text-[15px] leading-tight transition-colors duration-300",
                                                    tab.isActive ? "text-white" : "text-gray-600 group-hover:text-gray-700"
                                                )}
                                            >
                                                {tab.title}
                                            </Label>
                                        </div>
                                        
                                        {/* Stats - only on larger desktops */}
                                        {tab.stats.length > 0 && (
                                            <div className="hidden lg:flex items-center justify-center gap-1 mt-1">
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
                                                            <span className={`w-1 h-1 rounded-full ${tab.isActive ? "bg-white/80" : "bg-gray-500"} mx-0.5`} />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    )
} 