'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { usePathname, useRouter } from 'next/navigation'
import HomeIcon from './icons/home-icon'
import CompassIcon from './icons/compass-icon'
import PieChartIcon from './icons/pie-chart-icon'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'
import ConnectWalletButton from './ConnectWalletButton'
import Link from 'next/link'
import { Badge } from './ui/badge'

type TTab = {
    id: number
    name: string
    href: string
    icon: React.FC<{ height?: number; width?: number; className?: string }>
}

const tabs: TTab[] = [
    { id: 1, name: 'Home', href: "/", icon: HomeIcon },
    { id: 2, name: 'Discover', href: '/discover', icon: CompassIcon },
    { id: 3, name: 'Portfolio', href: '/portfolio', icon: PieChartIcon },
]

const activeTabInitialValue = (pathname: string) => {
    return tabs.find((tab) => tab.href === pathname) || null
}

const Header: React.FC = () => {
    const router = useRouter()
    const pathname = usePathname()
    const [activeTab, setActiveTab] = useState<TTab | null>(
        activeTabInitialValue(pathname)
    )
    const [openMenu, setOpenMenu] = useState(false)

    useEffect(() => {
        setActiveTab(activeTabInitialValue(pathname))
    }, [pathname])

    const handleTabClick = (tab: TTab) => {
        setActiveTab(tab)
        setOpenMenu(false)
        router.push(`${tab.href}`)
    }

    const BUTTON_DEFAULT_DESKTOP_STYLES =
        'group self-stretch p-0 rounded-[14px] uppercase hover:text-primary'
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

    function handleCloseMenu() {
        setOpenMenu(false)
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
            <header className="z-50 sticky top-0 md:top-5 left-0 max-w-[1200px] w-full mx-auto md:px-5">
                <div className="flex gap-5 max-lg:gap-10 justify-between items-center py-0 pr-[8px] pl-4 sm:pl-[20px] mb-5 md:mb-14 w-full font-semibold uppercase md:rounded-6 bg-white bg-opacity-40 backdrop-blur min-h-[56px] shadow-[0px_2px_2px_rgba(0,0,0,0.02)] max-md:max-w-full max-w-[1200px] mx-auto">
                    <Link href="/" className="relative md:w-[24px] md:w-fit p-0">
                        <img
                            loading="lazy"
                            src={'/images/logos/superlend-logo.webp'}
                            alt="Superlend logo"
                            className="object-contain shrink-0 my-auto aspect-[6.54] w-36 cursor-pointer"
                        />
                        <Badge variant="blue" className="absolute top-[4px] -right-12 w-fit rounded-full px-2 py-[2px]">
                            Beta
                        </Badge>
                    </Link>

                    <nav className="hidden min-[850px]:flex gap-3 lg:gap-5 items-center self-stretch my-auto text-sm tracking-normal leading-none whitespace-nowrap min-w-[240px] text-stone-800 max-md:max-w-full">
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                variant={isSelected(tab) ? 'default' : 'ghost'}
                                size="lg"
                                className={`${isSelected(tab) ? BUTTON_ACTIVE_DESKTOP_STYLES : BUTTON_INACTIVE_DESKTOP_STYLES}`}
                            // onClick={() => handleTabClick(tab)}
                            >
                                <Link
                                    onClick={() => handleTabClick(tab)}
                                    href={tab.href}
                                    className={`${LINK_DEFAULT_STYLES}`}
                                >
                                    <tab.icon />
                                    <span className="leading-[0]">
                                        {tab.name}
                                    </span>
                                </Link>
                            </Button>
                        ))}
                    </nav>
                    <div className="flex items-center gap-[12px]">
                        <ConnectWalletButton />
                        {/* <Button variant="outline" size={"md"} className="hidden max-md:block rounded-[12px] py-2 border border-gray-500 py-[6px]" onClick={() => setOpenMenu(true)}>
              <Menu className='text-gray-600' />
            </Button> */}
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
