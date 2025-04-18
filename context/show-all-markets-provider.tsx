'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChainId } from '@/types/chain'

interface ShowAllMarketsContextType {
    showAllMarkets: boolean
    setShowAllMarkets: (value: boolean) => void
    toggleShowAllMarkets: (checked: boolean, marketId?: 'all-markets' | 'etherlink' | 'polygon') => void
    isLoading: boolean
    activeMarket: 'all-markets' | 'etherlink' | 'polygon'
    setActiveMarket: (market: 'all-markets' | 'etherlink' | 'polygon') => void
}

const ShowAllMarketsContext = createContext<ShowAllMarketsContextType | undefined>(undefined)

export function ShowAllMarketsProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(true)
    const [showAllMarkets, setShowAllMarkets] = useState(false)
    const [activeMarket, setActiveMarket] = useState<'all-markets' | 'etherlink' | 'polygon'>('all-markets')

    // Initialize state from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('show_all_markets')
        const storedMarket = localStorage.getItem('active_market')

        if (stored !== null) {
            setShowAllMarkets(stored === 'true')
        }

        if (storedMarket !== null && (storedMarket === 'all-markets' || storedMarket === 'etherlink' || storedMarket === 'polygon')) {
            setActiveMarket(storedMarket as 'all-markets' | 'etherlink' | 'polygon')
        }
        setIsLoading(false)
    }, [])

    // Handle route synchronization
    useEffect(() => {
        if (!isLoading && (pathname === '/discover' || pathname === '/etherlink' || pathname === '/polygon')) {
            // Update state and localStorage to match the URL pathname
            const currentPath = pathname === '/discover' ? 'all-markets' : pathname.substring(1) as 'etherlink' | 'polygon'

            setActiveMarket(currentPath)
            localStorage.setItem('active_market', currentPath)

            // Keep showAllMarkets for backward compatibility
            const shouldShowAll = currentPath === 'all-markets'
            setShowAllMarkets(shouldShowAll)
            localStorage.setItem('show_all_markets', shouldShowAll.toString())
        }
    }, [pathname, isLoading])

    const toggleShowAllMarkets = (checked: boolean, marketId?: 'all-markets' | 'etherlink' | 'polygon') => {
        // Calculate the new values first, then update state and localStorage
        const newShowAllMarkets = checked;
        const newMarket = checked ? 'all-markets' : marketId || (activeMarket === 'all-markets' ? 'etherlink' : activeMarket);

        // Check if state actually needs to be updated
        if (showAllMarkets !== newShowAllMarkets || activeMarket !== newMarket) {
            // Batch state updates
            setShowAllMarkets(newShowAllMarkets);
            setActiveMarket(newMarket);

            // Update localStorage
            localStorage.setItem('show_all_markets', newShowAllMarkets.toString());
            localStorage.setItem('active_market', newMarket);

            // Determine route
            let targetRoute = '/discover';
            let queryParams = '';

            if (!newShowAllMarkets) {
                if (newMarket === 'polygon') {
                    targetRoute = '/polygon';
                    queryParams = `?chain_ids=${ChainId.Polygon}`;
                } else {
                    targetRoute = '/etherlink';
                    queryParams = `?chain_ids=${ChainId.Etherlink}`;
                }
            }

            // Navigate
            router.replace(targetRoute + queryParams);
        }
    }

    return (
        <ShowAllMarketsContext.Provider value={{
            showAllMarkets,
            setShowAllMarkets,
            toggleShowAllMarkets,
            isLoading,
            activeMarket,
            setActiveMarket
        }}>
            {children}
        </ShowAllMarketsContext.Provider>
    )
}

export function useShowAllMarkets() {
    const context = useContext(ShowAllMarketsContext)
    if (context === undefined) {
        throw new Error('useShowAllMarkets must be used within a ShowAllMarketsProvider')
    }
    return context
} 