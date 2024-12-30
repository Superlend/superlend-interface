'use client'

import { BigNumber } from 'ethers'
import { createContext, useContext, useState } from 'react'

const LendBorrowTxInitialState: TLendBorrowTxContext = {
    lendTx: {
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    },
    setLendTx: () => { },
    borrowTx: {
        status: 'borrow',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    },
    setBorrowTx: () => { },
}

export const LendBorrowTxContext = createContext<TLendBorrowTxContext>(
    LendBorrowTxInitialState
)

export type TLendTx = {
    status: 'approve' | 'lend' | 'view'
    hash: string
    allowanceBN: BigNumber
    isRefreshingAllowance: boolean
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
}

export type TBorrowTx = {
    status: 'borrow' | 'view'
    hash: string
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
}

export type TLendBorrowTxContext = {
    lendTx: TLendTx
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

    const [lendTx, setLendTx] = useState<TLendTx>({
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    })

    const [borrowTx, setBorrowTx] = useState<TBorrowTx>({
        status: 'borrow',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
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
