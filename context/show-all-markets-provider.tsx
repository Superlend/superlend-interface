'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ShowAllMarketsContextType {
    showAllMarkets: boolean
    setShowAllMarkets: (value: boolean) => void
    toggleShowAllMarkets: (checked: boolean) => void
    isLoading: boolean
}

const ShowAllMarketsContext = createContext<ShowAllMarketsContextType | undefined>(undefined)

export function ShowAllMarketsProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(true)
    const [showAllMarkets, setShowAllMarkets] = useState(false)

    // Initialize state from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('show_all_markets')
        if (stored !== null) {
            setShowAllMarkets(stored === 'true')
        }
        setIsLoading(false)
    }, [])

    // Handle route synchronization
    useEffect(() => {
        if (!isLoading && (pathname === '/discover' || pathname === '/etherlink')) {
            const storedShowAll = localStorage.getItem('show_all_markets') === 'true'
            
            // If state doesn't match localStorage, update state to match localStorage
            if (showAllMarkets !== storedShowAll) {
                setShowAllMarkets(storedShowAll)
            }
            
            // Then ensure route matches the localStorage value
            const expectedRoute = storedShowAll ? '/discover' : '/etherlink'
            if (pathname !== expectedRoute) {
                router.replace(expectedRoute + (expectedRoute === '/etherlink' ? '?chain_ids=42793' : ''))
            }
        }
    }, [pathname, isLoading, showAllMarkets, router])

    const toggleShowAllMarkets = (checked: boolean) => {
        setShowAllMarkets(checked)
        localStorage.setItem('show_all_markets', checked.toString())
        
        const targetRoute = checked ? '/discover' : '/etherlink'
        router.replace(targetRoute + (targetRoute === '/etherlink' ? '?chain_ids=42793' : ''))
    }

    return (
        <ShowAllMarketsContext.Provider value={{ 
            showAllMarkets, 
            setShowAllMarkets, 
            toggleShowAllMarkets,
            isLoading 
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