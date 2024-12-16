'use client'

import { useERC20Balance } from '@/hooks/useERC20Balance'
import { BigNumber } from 'ethers'
import { createContext, useContext, useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'

const LendBorrowTxInitialState: TLendBorrowTxContext = {
    lendTx: {
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
    },
    setLendTx: () => {},
    borrowTx: {
        status: 'borrow',
        hash: '',
        errorMessage: '',
    },
    setBorrowTx: () => {},
}

export const LendBorrowTxContext = createContext<TLendBorrowTxContext>(
    LendBorrowTxInitialState
)

export type TLendBorrowTx = {
    status: 'approve' | 'lend' | 'view'
    hash: string
    allowanceBN: BigNumber
    isRefreshingAllowance: boolean
    errorMessage: string
}

export type TBorrowTx = {
    status: 'borrow' | 'view'
    hash: string
    errorMessage: string
}

export type TLendBorrowTxContext = {
    lendTx: TLendBorrowTx
    setLendTx: any
    borrowTx: TBorrowTx
    setBorrowTx: any
}

export default function LendBorrowTxProvider({
    children,
}: {
    children: React.ReactNode
}) {
    // const activeAccount = useActiveAccount()
    // const walletAddress = activeAccount?.address

    const [lendTx, setLendTx] = useState<TLendBorrowTx>({
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
    })

    const [borrowTx, setBorrowTx] = useState<TBorrowTx>({
        status: 'borrow',
        hash: '',
        errorMessage: '',
    })

    return (
        <LendBorrowTxContext.Provider
            value={{
                lendTx,
                setLendTx,
                borrowTx,
                setBorrowTx,
            }}
        >
            {children}
        </LendBorrowTxContext.Provider>
    )
}

export const useLendBorrowTxContext = () => {
    const context = useContext(LendBorrowTxContext)
    if (!context)
        throw new Error(
            'useLendBorrowTxContext must be used within an LendBorrowTxProvider'
        )
    return context
}
