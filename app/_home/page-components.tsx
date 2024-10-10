'use client'

import React, { useEffect } from 'react'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import LendingForm from '@/components/LendingForm'
import MainContainer from '@/components/MainContainer'
import TokenRates from '@/components/TokenRates'

export default function HomePageComponents() {

    return (
        <MainContainer>
            <div className="flex flex-col items-center w-full max-w-[1176px] max-md:max-w-full">
                {/* <LendBorrowToggle /> */}
                <TokenRates />
                <LendingForm />
            </div>
        </MainContainer>
    )
}
