'use client'

import { BigNumber } from 'ethers'
import { createContext, useContext, useState } from 'react'

export type TTxContext = {
    lendTx: TLendTx
    setLendTx: any
    borrowTx: TBorrowTx
    setBorrowTx: any
    repayTx: TRepayTx
    setRepayTx: any
    withdrawTx: TWithdrawTx
    setWithdrawTx: any
    loopTx: TLoopTx
    setLoopTx: any
    isLendBorrowTxDialogOpen: boolean
    setIsLendBorrowTxDialogOpen: any
    isWithdrawRepayTxDialogOpen: boolean
    setIsWithdrawRepayTxDialogOpen: any
}

const TxInitialState: TTxContext = {
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
    repayTx: {
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    },
    setRepayTx: () => { },
    withdrawTx: {
        status: 'approve',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isRefreshingAllowance: false,
        allowanceBN: BigNumber.from(0),
    },
    loopTx: {
        status: 'approve',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        hasCreditDelegation: false,
    },
    setLoopTx: () => { },
    setWithdrawTx: () => { },
    isLendBorrowTxDialogOpen: false,
    setIsLendBorrowTxDialogOpen: () => { },
    isWithdrawRepayTxDialogOpen: false,
    setIsWithdrawRepayTxDialogOpen: () => { },
}

export const TxContext = createContext<TTxContext>(TxInitialState)

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

export type TRepayTx = {
    status: 'approve' | 'repay' | 'view'
    hash: string
    allowanceBN: BigNumber
    isRefreshingAllowance: boolean
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
}

export type TWithdrawTx = {
    status: 'approve' | 'withdraw' | 'view'
    hash: string
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
    isRefreshingAllowance: boolean
    allowanceBN: BigNumber
}

export type TLoopTx = {
    status: 'approve' | 'credit_delegation' | 'loop' | 'view'
    hash: string
    errorMessage: string
    isPending: boolean
    isConfirming: boolean
    isConfirmed: boolean
    hasCreditDelegation: boolean
}

export default function TxProvider({
    children,
}: {
    children: React.ReactNode
}) {
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

    const [repayTx, setRepayTx] = useState<TRepayTx>({
        status: 'approve',
        hash: '',
        allowanceBN: BigNumber.from(0),
        isRefreshingAllowance: false,
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
    })

    const [withdrawTx, setWithdrawTx] = useState<TWithdrawTx>({
        status: 'approve',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isRefreshingAllowance: false,
        allowanceBN: BigNumber.from(0),
    })

    const [loopTx, setLoopTx] = useState<TLoopTx>({
        status: 'approve',
        hash: '',
        errorMessage: '',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        hasCreditDelegation: false,
    })

    const [isLendBorrowTxDialogOpen, setIsLendBorrowTxDialogOpen] =
        useState(false)
    const [isWithdrawRepayTxDialogOpen, setIsWithdrawRepayTxDialogOpen] =
        useState(false)

    return (
        <TxContext.Provider
            value={{
                lendTx,
                setLendTx,
                borrowTx,
                setBorrowTx,
                repayTx,
                setRepayTx,
                withdrawTx,
                setWithdrawTx,
                loopTx,
                setLoopTx,
                isLendBorrowTxDialogOpen,
                setIsLendBorrowTxDialogOpen,
                isWithdrawRepayTxDialogOpen,
                setIsWithdrawRepayTxDialogOpen,
            }}
        >
            {children}
        </TxContext.Provider>
    )
}

export const useTxContext = () => {
    const context = useContext(TxContext)
    if (!context)
        throw new Error('useTxContext must be used within an TxProvider')
    return context
}
