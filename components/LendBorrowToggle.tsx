'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { TPositionType } from '@/types'

type TProps = {
    type: TPositionType
    handleToggle: (positionType: TPositionType) => void
    addCollateral?: boolean
    title?: {
        lend?: string
        borrow?: string
    }
    showTab?: {
        lend?: boolean
        borrow?: boolean
    }
}

const titleInitial = {
    lend: 'Lend',
    borrow: 'Borrow',
}

const showTabInitial = {
    lend: true,
    borrow: true,
}

const LendBorrowToggle = ({ type, handleToggle, title, showTab }: TProps) => {
    const positionType = {
        lend: 'lend',
        borrow: 'borrow',
    }

    function checkType(typeToMatch: TPositionType): boolean {
        return positionType[typeToMatch] === type
    }

    const BUTTON_DEFAULT_STYLE =
        'flex items-center justify-center py-[8px] grow-1 min-w-[120px] w-full flex-1 h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-3'
    const BUTTON_ACTIVE_STYLE =
        'shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]'

    return (
        <div className="flex gap-1 items-center w-full p-[4px] tracking-normal leading-tight uppercase whitespace-nowrap rounded-4 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
            {(showTab ? showTab?.lend : showTabInitial.lend) && <Button
                variant={checkType('lend') ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('lend')}
                className={`${BUTTON_DEFAULT_STYLE} ${checkType('lend') ? BUTTON_ACTIVE_STYLE : ''}`}
            >
                {title?.lend || titleInitial.lend}
            </Button>
            }
            {(showTab ? showTab?.borrow : showTabInitial.borrow) && <Button
                variant={checkType('borrow') ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('borrow')}
                className={`${BUTTON_DEFAULT_STYLE} ${checkType('borrow') ? BUTTON_ACTIVE_STYLE : ''}`}
            >
                {title?.borrow || titleInitial.borrow}
            </Button>
            }
        </div>
    )
}

export default LendBorrowToggle
