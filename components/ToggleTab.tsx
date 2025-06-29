'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { TPositionType } from '@/types'
import useDimensions from '@/hooks/useDimensions'
import { ChevronDown } from 'lucide-react'

export type TTypeToMatch = 'tab1' | 'tab2' | 'tab3'

type TProps = {
    type: TTypeToMatch
    handleToggle: (positionType: TTypeToMatch) => void
    title?: {
        tab1?: string
        tab2?: string
        tab3?: string
    }
    showTab?: {
        tab1?: boolean
        tab2?: boolean
        tab3?: boolean
    }
}

const titleInitial = {
    tab1: 'Earn',
    tab2: 'Borrow',
    tab3: 'Loop',
}

const showTabInitial = {
    tab1: true,
    tab2: true,
    tab3: false,
}

// Utility function to calculate recommended container width based on visible tabs
export const getToggleTabContainerWidth = (visibleTabsCount: number): string => {
    // Calculate based on: (min-width per tab × count) + padding + gaps
    // 2 tabs: 120px × 2 + 32px padding + 4px gap = ~280px → max-w-[350px]
    // 3 tabs: 100px × 3 + 32px padding + 8px gaps = ~340px → max-w-[450px]
    // 4+ tabs: 90px × count + padding + gaps
    
    if (visibleTabsCount <= 2) return 'sm:max-w-[350px]'
    if (visibleTabsCount === 3) return 'sm:max-w-[450px]'
    return 'sm:max-w-[500px]'
}

// Helper function to count visible tabs from showTab prop
export const countVisibleTabs = (showTab?: {
    tab1?: boolean
    tab2?: boolean
    tab3?: boolean
}): number => {
    const actualShowTab = showTab || showTabInitial
    let count = 0
    
    if (actualShowTab.tab1 ?? showTabInitial.tab1) count++
    if (actualShowTab.tab2 ?? showTabInitial.tab2) count++
    if (actualShowTab.tab3 ?? showTabInitial.tab3) count++
    
    return count
}

const ToggleTab = ({ type, handleToggle, title, showTab }: TProps) => {
    const { width } = useDimensions()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    
    const isMobile = width <= 425

    const positionType = {
        tab1: 'tab1' as const,
        tab2: 'tab2' as const,
        tab3: 'tab3' as const,
    }

    function checkType(typeToMatch: TTypeToMatch): boolean {
        return positionType[typeToMatch] === type
    }

    // Helper function to get visible tabs
    const getVisibleTabs = () => {
        const tabs = []
        const actualShowTab = showTab || showTabInitial
        
        if (actualShowTab.tab1 ?? showTabInitial.tab1) {
            tabs.push({
                key: 'tab1' as TTypeToMatch,
                label: title?.tab1 || titleInitial.tab1,
                isActive: checkType('tab1')
            })
        }
        if (actualShowTab.tab2 ?? showTabInitial.tab2) {
            tabs.push({
                key: 'tab2' as TTypeToMatch,
                label: title?.tab2 || titleInitial.tab2,
                isActive: checkType('tab2')
            })
        }
        if (actualShowTab.tab3 ?? showTabInitial.tab3) {
            tabs.push({
                key: 'tab3' as TTypeToMatch,
                label: title?.tab3 || titleInitial.tab3,
                isActive: checkType('tab3')
            })
        }
        
        return tabs
    }

    const visibleTabs = getVisibleTabs()
    const activeTab = visibleTabs.find(tab => tab.isActive)
    const shouldShowDropdown = isMobile && visibleTabs.length > 2

    const handleDropdownSelect = (tabKey: TTypeToMatch) => {
        handleToggle(tabKey)
        setIsDropdownOpen(false)
    }

    // Dynamic button styling based on number of visible tabs
    const getButtonMinWidth = () => {
        if (visibleTabs.length === 2) return 'min-w-[120px]'
        if (visibleTabs.length === 3) return 'min-w-[100px]'
        return 'min-w-[90px]'
    }

    const BUTTON_DEFAULT_STYLE = `flex items-center justify-center py-[8px] grow-1 ${getButtonMinWidth()} w-full flex-1 h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-4`
    const BUTTON_ACTIVE_STYLE =
        'shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]'

    // Dropdown Component
    if (shouldShowDropdown) {
        return (
            <div className="relative w-full">
                <div className="flex gap-1 items-center w-full p-[4px] tracking-normal leading-tight uppercase whitespace-nowrap rounded-5 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`${BUTTON_DEFAULT_STYLE} ${BUTTON_ACTIVE_STYLE} justify-between`}
                    >
                        <span>{activeTab?.label}</span>
                        <ChevronDown 
                            className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </Button>
                </div>
                
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white bg-opacity-95 backdrop-blur-sm rounded-5 shadow-lg border border-white/20 overflow-hidden">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleDropdownSelect(tab.key)}
                                className={`w-full px-4 py-3 text-left uppercase font-semibold text-stone-800 hover:bg-white/50 transition-colors duration-150 ${
                                    tab.isActive 
                                        ? 'bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)] text-white' 
                                        : ''
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Overlay to close dropdown when clicking outside */}
                {isDropdownOpen && (
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsDropdownOpen(false)}
                    />
                )}
            </div>
        )
    }

    // Original Tab Layout
    return (
        <div className="flex gap-1 items-center w-full p-[4px] tracking-normal leading-tight uppercase whitespace-nowrap rounded-5 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
            {(showTab ? (showTab?.tab1 ?? showTabInitial.tab1) : showTabInitial.tab1) && (
                <Button
                    variant={checkType('tab1') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('tab1')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('tab1') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.tab1 || titleInitial.tab1}
                </Button>
            )}
            {(showTab ? (showTab?.tab2 ?? showTabInitial.tab2) : showTabInitial.tab2) && (
                <Button
                    variant={checkType('tab2') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('tab2')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('tab2') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.tab2 || titleInitial.tab2}
                </Button>
            )}
            {(showTab ? (showTab?.tab3 ?? showTabInitial.tab3) : showTabInitial.tab3) && (
                <Button
                    variant={checkType('tab3') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('tab3')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('tab3') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.tab3 || titleInitial.tab3}
                </Button>
            )}
        </div>
    )
}

export default ToggleTab
