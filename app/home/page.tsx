import LendBorrowToggle from '@/components/LendBorrowToggle'
import LendingForm from '@/components/LendingForm'
import MainContainer from '@/components/MainContainer'
import TokenRates from '@/components/TokenRates'
import React from 'react'

export default function Home() {
    return (
        <MainContainer>
            <div className="flex flex-col items-center w-full max-w-[1176px] max-md:max-w-full">
                <LendBorrowToggle />
                <TokenRates />
                <LendingForm />
            </div>
        </MainContainer>
    )
}
