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
    erc20TokensBalanceData: Record<
        number,
        Record<string, { balanceRaw: string; balanceFormatted: number }>
    >
}

export default function LendBorrowTxProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address

    const [lendTx, setLendTx] = useState<TLendBorrowTx>({
        status: 'approve',
        hash: '',
    })
    const { data: erc20TokensBalanceData } = useERC20Balance(
        walletAddress as `0x${string}`
    )

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
                erc20TokensBalanceData,
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
