'use client'

import { useERC20Balance } from '@/hooks/useERC20Balance'
import useGetChainsData from '@/hooks/useGetChainsData'
import useGetTokensData from '@/hooks/useGetTokensData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { TChain } from '@/types/chain'
import { createContext, useContext, useEffect, useState } from 'react'
// import { useActiveAccount } from 'thirdweb/react'
import { useAccount } from 'wagmi'
import { useAssetsDataContext } from './data-provider'

type TUserTokenBalancesProps = {
    erc20TokensBalanceData: any
    formattedTokenBalances: TTokenBalance[]
    isLoading: boolean
    isRefreshing: boolean
    setIsRefreshing: (value: boolean) => void
}

export const UserTokenBalancesContext = createContext<TUserTokenBalancesProps>({
    erc20TokensBalanceData: {},
    formattedTokenBalances: [],
    isLoading: false,
    isRefreshing: false,
    setIsRefreshing: () => { },
})

type TTokenBalance = {
    token: any
    chain: TChain
}

export default function UserTokenBalancesProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const { walletAddress, isWalletConnected } = useWalletConnection()
    const { allTokensData, allChainsData } = useAssetsDataContext()

    const {
        data: erc20TokensBalanceData,
        isLoading,
        isRefreshing,
        setIsRefreshing,
    } = useERC20Balance(walletAddress as `0x${string}`)

    useEffect(() => {
        setIsRefreshing(true)
    }, [walletAddress])

    function getFormattedTokenBalances(
        erc20TokensBalanceData: Record<number, Record<string, { balanceRaw: string; balanceFormatted: number }>>,
        allTokensData: any,
        allChainsData: TChain[]
    ): TTokenBalance[] {
        const result: TTokenBalance[] = [];

        for (const chainId in erc20TokensBalanceData) {
            const chainIdNumber = Number(chainId);
            const tokenBalances = erc20TokensBalanceData[chainIdNumber];

            for (const tokenAddress in tokenBalances) {
                const balanceData = tokenBalances[tokenAddress];
                const token = allTokensData[chainIdNumber]?.find((token: any) => token.address.toLowerCase() === tokenAddress.toLowerCase());
                const chain = allChainsData.find((chain) => chain.chain_id === chainIdNumber);

                result.push({
                    token: {
                        ...token,
                        balance: balanceData.balanceFormatted,
                    },
                    chain: chain as TChain,
                });
            }
        }

        return result;
    }

    function getFormattedFallbackTokenBalances(allTokensData: any) {
        const output: any = {};

        for (const chainId in allTokensData) {
            if (allTokensData.hasOwnProperty(chainId)) {
                const tokens = allTokensData[chainId];
                output[chainId] = {};

                tokens.forEach((token: any) => {
                    output[chainId][token.address] = {
                        balanceRaw: '0',
                        balanceFormatted: 0,
                    };
                });
            }
        }

        return output;
    }

    const fallbackTokenBalanceData = getFormattedFallbackTokenBalances(allTokensData);
    const formattedTokenBalances = getFormattedTokenBalances(isWalletConnected ? erc20TokensBalanceData : fallbackTokenBalanceData, allTokensData, allChainsData);

    return (
        <UserTokenBalancesContext.Provider
            value={{
                erc20TokensBalanceData,
                formattedTokenBalances,
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
