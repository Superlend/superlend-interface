'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { usePathname, useRouter } from 'next/navigation'
import HomeIcon from './icons/home-icon'
import CompassIcon from './icons/compass-icon'
import PieChartIcon from './icons/pie-chart-icon'
import RewardsIcon from './icons/rewards-icon'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { CirclePower, InfoIcon, Menu, TrophyIcon, X } from 'lucide-react'
import { motion } from 'framer-motion'
import ConnectWalletButton from './ConnectWalletButton'
import CheckInButton from './CheckInButton'
import Link from 'next/link'
import { Badge } from './ui/badge'
import { ChainId } from '@/types/chain'
import TopBanner from './TopBanner'
import InfoTooltip from './tooltips/InfoTooltip'
import { useOnboardingContext } from './providers/OnboardingProvider'
import useDimensions from '@/hooks/useDimensions'

type TTab = {
    id: number
    name: string
    href: string
    icon: React.FC<{ height?: number; width?: number; className?: string }>
}

const Header: React.FC = () => {
    const { resetOnboarding } = useOnboardingContext()
    const { width: screenWidth } = useDimensions()
    const isDesktop = useMemo(() => screenWidth > 768, [screenWidth])
    const tabs: TTab[] = [
        { id: 1, name: 'Home', href: '/', icon: HomeIcon },
        { id: 2, name: 'Discover', href: getRedirectionLink('/discover'), icon: CompassIcon },
        { id: 3, name: 'Portfolio', href: '/portfolio', icon: PieChartIcon },
        // { id: 4, name: 'Points', href: '/points', icon: RewardsIcon },
    ]


    function handleStartTour() {
        resetOnboarding()
    }

    const activeTabInitialValue = (pathname: string) => {
        // Treat /etherlink as /discover for tab highlighting
        const normalizedPath = pathname === '/etherlink' ? '/etherlink' : pathname
        return tabs.find((tab) => tab.href.includes(normalizedPath)) || null
    }
    const pathname = usePathname()
    const [activeTab, setActiveTab] = useState<TTab | null>(
        activeTabInitialValue(pathname || '')
    )

    useEffect(() => {
        setActiveTab(activeTabInitialValue(pathname || ''))
    }, [pathname])

    const handleTabClick = (tab: TTab) => {
        setActiveTab(tab)
    }

    function getRedirectionLink(href: string) {
        if (href === '/discover') {
            // Check if we're in a browser environment before accessing localStorage
            if (typeof window !== 'undefined') {
                // Get the initial state from localStorage, default to true if not set
                const stored = localStorage.getItem('show_all_markets')
                const activeMarket = localStorage.getItem('active_market') || 'all-markets'
                const showAllMarkets = stored !== null ? stored === 'true' : true

                // Set the initial value in localStorage if not set
                if (stored === null) {
                    localStorage.setItem('show_all_markets', 'true')
                }

                // Always navigate to the correct route based on the localStorage values
                if (showAllMarkets) {
                    return '/discover'
                } else {
                    // Route based on active market
                    if (activeMarket === 'polygon') {
                        return `/polygon?chain_ids=${ChainId.Polygon}`
                    } else {
                        return `/etherlink?chain_ids=${ChainId.Etherlink}`
                    }
                }
            }
            // Default path for server-side rendering
            return `/etherlink?chain_ids=${ChainId.Etherlink}`
        }

        return href
    }

    const BUTTON_DEFAULT_DESKTOP_STYLES =
        'group relative self-stretch p-0 rounded-[14px] uppercase hover:text-primary'
    const BUTTON_INACTIVE_DESKTOP_STYLES = `${BUTTON_DEFAULT_DESKTOP_STYLES} opacity-50 hover:opacity-100`
    const BUTTON_ACTIVE_DESKTOP_STYLES = `${BUTTON_DEFAULT_DESKTOP_STYLES}`

    const BUTTON_DEFAULT_MOBILE_STYLES =
        'group self-stretch border-0 p-0 mx-4 my-2'
    const BUTTON_INACTIVE_MOBILE_STYLES = `${BUTTON_DEFAULT_MOBILE_STYLES} opacity-50`
    const BUTTON_ACTIVE_MOBILE_STYLES = `${BUTTON_DEFAULT_MOBILE_STYLES} text-primary hover:text-primary active`

    const LINK_DEFAULT_STYLES =
        'flex max-md:flex-col items-center justify-center gap-3 md:gap-2 px-1 py-2'

    function isSelected(tab: TTab) {
        return tab.id === activeTab?.id
    }

    const menuContainerVariant = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    }

    const menuItemVariant = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 },
    }

    return (
        <>
            <TopBanner />
            <header className="z-50 sticky top-0 md:top-5 left-0 max-w-[1200px] w-full mx-auto md:px-5 transition-all duration-400 ease-banner banner-visible:pt-[100px] banner-visible:min-[425px]:pt-[85px] banner-visible:sm:pt-[40px] banner-visible:lg:pt-[35px]">
                <div className="flex gap-5 max-lg:gap-5 justify-between items-center py-0 pr-2 pl-4 sm:pl-[20px] mb-5 md:mb-14 w-full font-semibold uppercase md:rounded-6 bg-white bg-opacity-40 backdrop-blur min-h-[56px] shadow-[0px_2px_2px_rgba(0,0,0,0.02)] max-md:max-w-full max-w-[1200px] mx-auto">
                    <Link
                        href="/"
                        className="relative md:w-[24px] md:w-fit p-0 mr-2"
                    >
                        <img
                            loading="lazy"
                            src={'/images/logos/superlend-logo.webp'}
                            alt="Superlend logo"
                            className="object-contain shrink-0 my-auto aspect-[6.54] w-36 cursor-pointer"
                        />
                        <Badge
                            variant="blue"
                            className="absolute max-md:bg-transparent max-md:left-6 md:top-[4px] md:-right-12 w-fit rounded-full px-2 py-[2px]"
                        >
                            Beta
                        </Badge>
                    </Link>

                    <nav className="hidden min-[850px]:flex gap-4 lg:gap-8 items-center self-stretch my-auto text-sm tracking-normal leading-none whitespace-nowrap min-w-[240px] text-stone-800 max-md:max-w-full">
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                variant={isSelected(tab) ? 'default' : 'ghost'}
                                size="lg"
                                className={`${isSelected(tab) ? BUTTON_ACTIVE_DESKTOP_STYLES : BUTTON_INACTIVE_DESKTOP_STYLES}`}
                            >
                                {tab.id === 3 &&
                                    <Badge className="absolute -top-2 -right-2 bg-secondary-100 w-6 h-6 text-white text-[11px] font-bold rounded-full overflow-hidden pointer-events-none">
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute inset-0 animate-shine bg-gradient-to-br from-white/0 via-white/70 to-white/0 -translate-x-full" />
                                        </div>
                                        <TrophyIcon className="w-5 h-5 stroke-white relative z-10 ignore-group" />
                                    </Badge>
                                }
                                <Link
                                    onClick={() => handleTabClick(tab)}
                                    href={tab.href}
                                    className={LINK_DEFAULT_STYLES}
                                >
                                    <tab.icon />
                                    <span className="leading-[0]">
                                        {tab.name}
                                    </span>
                                </Link>
                            </Button>
                        ))}
                    </nav>
                    <div className="flex items-center gap-[16px]">
                        <InfoTooltip
                            hide={!isDesktop}
                            label={
                                <Button
                                    variant="ghost"
                                    className="p-0 w-fit flex items-center justify-center group hover:scale-110 transition-all duration-300"
                                    onClick={handleStartTour}
                                >
                                    <CirclePower className="w-5 h-5 stroke-primary/75 group-hover:stroke-primary" />
                                </Button>
                            }
                            content={'Start Tour'}
                        />
                        <div className="max-w-[120px] w-full">
                            <ConnectWalletButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Footer nav */}
            <div className="z-50 fixed bottom-0 left-0 min-[850px]:hidden w-full flex justify-center">
                <nav className="flex gap-4 lg:gap-5 items-center justify-center self-stretch px-10 text-sm tracking-normal leading-none whitespace-nowrap text-stone-800 w-full bg-white bg-opacity-40 backdrop-blur">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={'ghost'}
                            size="lg"
                            className={`${isSelected(tab) ? BUTTON_ACTIVE_MOBILE_STYLES : BUTTON_INACTIVE_MOBILE_STYLES}`}
                        >
                            <Link
                                onClick={() => handleTabClick(tab)}
                                href={tab.href}
                                className={`${LINK_DEFAULT_STYLES}`}
                            >
                                <tab.icon className="max-sm:w-5 max-sm:h-5" />
                                <span className="max-[850px]:inline-block hidden leading-[0] text-inherit">
                                    {tab.name}
                                </span>
                            </Link>
                        </Button>
                    ))}
                </nav>
            </div>
            {/* Footer nav */}
        </>
    )
}

export default Header