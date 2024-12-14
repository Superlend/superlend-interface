'use client'

import { createContext, useContext, useState } from 'react'

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
    return useContext(LendBorrowTxContext)
}
