'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { TPositionType } from '@/types'

export type TTypeToMatch = 'tab1' | 'tab2';

type TProps = {
    type: TTypeToMatch
    handleToggle: (positionType: TTypeToMatch) => void
    title?: {
        tab1?: string
        tab2?: string
    }
    showTab?: {
        tab1?: boolean
        tab2?: boolean
    }
}

const titleInitial = {
    tab1: 'Lend',
    tab2: 'Borrow',
}

const showTabInitial = {
    tab1: true,
    tab2: true,
}

const ToggleTab = ({ type, handleToggle, title, showTab }: TProps) => {
    const positionType = {
        tab1: 'tab1',
        tab2: 'tab2',
    }
    
    function checkType(typeToMatch: TTypeToMatch): boolean {
        return positionType[typeToMatch] === type
    }

    const BUTTON_DEFAULT_STYLE =
        'flex items-center justify-center py-[8px] grow-1 min-w-[120px] w-full flex-1 h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-4'
    const BUTTON_ACTIVE_STYLE =
        'shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]'

    return (
        <div className="flex gap-1 items-center w-full p-[4px] tracking-normal leading-tight uppercase whitespace-nowrap rounded-5 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
            {(showTab ? showTab?.tab1 : showTabInitial.tab1) && (
                <Button
                    variant={checkType('tab1') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('tab1')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('tab1') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.tab1 || titleInitial.tab1}
                </Button>
            )}
            {(showTab ? showTab?.tab2 : showTabInitial.tab2) && (
                <Button
                    variant={checkType('tab2') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('tab2')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('tab2') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.tab2 || titleInitial.tab2}
                </Button>
            )}
        </div>
    )
}

export default ToggleTab
