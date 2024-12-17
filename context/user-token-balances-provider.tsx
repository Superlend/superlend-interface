'use client'

import { useERC20Balance } from '@/hooks/useERC20Balance'
import useGetChainsData from '@/hooks/useGetChainsData'
import useGetTokensData from '@/hooks/useGetTokensData'
import { TChain } from '@/types/chain'
import { createContext, useContext, useEffect, useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'

type TUserTokenBalancesProps = {
    erc20TokensBalanceData: any
    isLoading: boolean
    isRefreshing: boolean
    setIsRefreshing: (value: boolean) => void
}

export const UserTokenBalancesContext = createContext<TUserTokenBalancesProps>({
    erc20TokensBalanceData: {},
    isLoading: false,
    isRefreshing: false,
    setIsRefreshing: () => {},
})

export default function UserTokenBalancesProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address

    const {
        data: erc20TokensBalanceData,
        isLoading,
        isRefreshing,
        setIsRefreshing,
    } = useERC20Balance(walletAddress as `0x${string}`)

    return (
        <UserTokenBalancesContext.Provider
            value={{
                erc20TokensBalanceData,
                isLoading,
                isRefreshing,
                setIsRefreshing,
            }}
        >
            {children}
        </UserTokenBalancesContext.Provider>
    )
}

export const useUserTokenBalancesContext = () => {
    const context = useContext(UserTokenBalancesContext)
    if (!context)
        throw new Error(
            'useUserTokenBalancesContext must be used within an UserTokenBalancesProvider'
        )
    return context
}
