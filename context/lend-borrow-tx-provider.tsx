'use client'

import { useERC20Balance } from '@/hooks/useERC20Balance'
import { createContext, useContext, useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'

export const LendBorrowTxContext = createContext<
    TLendBorrowTxContext | undefined
>(undefined)

export type TLendBorrowTx = {
    status: 'approve' | 'lend' | 'view'
    hash: string
}

export type TBorrowTx = {
    status: 'borrow' | 'view'
    hash: string
}

export type TLendBorrowTxContext = {
    lendTx: TLendBorrowTx
    setLendTx: (lendTx: TLendBorrowTx) => void
    borrowTx: TBorrowTx
    setBorrowTx: (borrowTx: TBorrowTx) => void
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
    })

    const [borrowTx, setBorrowTx] = useState<TBorrowTx>({
        status: 'borrow',
        hash: '',
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
