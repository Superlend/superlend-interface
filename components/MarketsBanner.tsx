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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useIsClient from '@/hooks/useIsClient'
import Container from './Container'

export default function MarketsBanner() {
    const { showAllMarkets, toggleShowAllMarkets, isLoading, activeMarket, setActiveMarket } = useShowAllMarkets()
    const pathname = usePathname()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const { isClient } = useIsClient()

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
            stats: ['Ongoing Rewards Program'],
            isActive: activeMarket === 'polygon',
            icon: <Image src="https://superlend-assets.s3.ap-south-1.amazonaws.com/polygon.svg" alt="Polygon chain logo" width={16} height={16} className="rotate-[30deg] mt-0.5" />
        }
    ]

    const activeTab = tabs.find(tab => tab.isActive) || tabs[0]

    const handleTabSelection = (tabId: string) => {
        try {
            if (!tabId) {
                console.warn('Tab ID is undefined in handleTabSelection');
                return;
            }

            if (tabId === activeTab?.id) return;

            if (tabId === 'all-markets') {
                toggleShowAllMarkets(true)
            } else {
                toggleShowAllMarkets(false, tabId as 'etherlink' | 'polygon')
            }

            setIsDropdownOpen(false)
        } catch (error) {
            console.error('Error in tab selection:', error);
            // Fallback - try to recover
            setIsDropdownOpen(false);
        }
    }

    return (
        <>
            {
                !isClient && (
                    <Container className="pb-3">
                        <Skeleton className="w-full h-[60px] flex-1 rounded-4" />
                    </Container>
                )
            }
            {
                isClient &&
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-md:sticky max-md:top-20 banner-visible:max-md:top-40 max-md:z-50"
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
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-4 shadow-lg z-10 overflow-hidden">
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

                                    {/* Tablet and Desktop Tabs (>= 640px) - Updated to use Flat Tabs style */}
                                    <div className="hidden sm:block w-full">
                                        <Tabs
                                            value={activeMarket}
                                            onValueChange={handleTabSelection}
                                            className="w-full"
                                        >
                                            <div className="sticky  z-10">
                                                {/* bg-white bg-opacity-40 backdrop-blur-md rounded-4 */}
                                                <TabsList className="w-full bg-transparent">
                                                    {tabs.map((tab) => (
                                                        <TabsTrigger
                                                            key={tab.id}
                                                            value={tab.id}
                                                            className="flex-1 items-center gap-2 rounded-none py-4 md:py-2 bg-transparent text-gray-500 border-b-[1px] border-gray-500 data-[state=active]:text-secondary-500 data-[state=active]:border-secondary-500 data-[state=active]:border-b-[2px] data-[state=active]:bg-transparent"
                                                        >
                                                            <div className="flex items-center justify-center gap-0">
                                                                <span className={cn(
                                                                    "transition-colors",
                                                                    tab.isActive ? "text-secondary-500" : "text-gray-600 grayscale opacity-50"
                                                                )}>
                                                                    {tab.icon}
                                                                </span>
                                                                <span className="ml-1">{tab.title || ""}</span>
                                                            </div>

                                                            {/* Stats - only on larger desktops */}
                                                            {tab.stats && tab.stats.length > 0 && (
                                                                <div className="hidden lg:flex items-center justify-center gap-1">
                                                                    {tab.stats.map((stat, i) => (
                                                                        <React.Fragment key={i}>
                                                                            <Label
                                                                                className={cn(
                                                                                    "text-xs transition-colors",
                                                                                    tab.isActive ? "text-secondary-500" : "text-gray-500"
                                                                                )}
                                                                                weight="medium"
                                                                            >
                                                                                {stat || ""}
                                                                            </Label>
                                                                            {i < tab.stats.length - 1 && (
                                                                                <span className={`w-1 h-1 rounded-full ${tab.isActive ? "bg-secondary-500" : "bg-gray-500"} mx-0.5`} />
                                                                            )}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>
                                            </div>

                                            {/* Empty TabsContent to maintain structure - actual content is outside tabs */}
                                            {tabs.map((tab) => (
                                                <TabsContent key={tab.id} value={tab.id} />
                                            ))}
                                        </Tabs>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            }
        </>
    )
} 