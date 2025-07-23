import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { BigNumber } from 'ethers'
import { ContractCallContext, ContractCallResults } from 'ethereum-multicall'
import { MULTICALL_ADDRESSES } from '../lib/constants'
import { createDirectProviders } from '@/lib/direct-providers'
import { providers } from 'ethers'
import { OptimizedMulticall } from '../hooks/useEthereumMulticall'

interface EthereumMulticallContextType {
    providers: Record<number, providers.JsonRpcProvider>
    multicall: Record<number, OptimizedMulticall>
    isLoading: boolean
    isError: boolean
    isInitialized: boolean
    ethMulticall: (
        calldata: ContractCallContext[],
        chainId: number,
        _multicall?: OptimizedMulticall
    ) => Promise<ContractCallResults>
    fetchNativeBalance: (
        address: string,
        chainId: number
    ) => Promise<BigNumber>
    resetMulticall: () => void
    // Legacy methods for backward compatibility
    initializeMulticall: () => Promise<void>
    initalizeEthMulticall: () => void
}

const EthereumMulticallContext = createContext<EthereumMulticallContextType | undefined>(undefined)

export const useEthereumMulticallContext = () => {
    const context = useContext(EthereumMulticallContext)
    if (!context) {
        throw new Error('useEthereumMulticallContext must be used within an EthereumMulticallProvider')
    }
    return context
}

interface EthereumMulticallProviderProps {
    children: ReactNode
}

export const EthereumMulticallProvider: React.FC<EthereumMulticallProviderProps> = ({ children }) => {
    const [providers, setProviders] = useState<Record<number, providers.JsonRpcProvider>>({})
    const [multicall, setMulticall] = useState<Record<number, OptimizedMulticall>>({})
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isError, setIsError] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    const initializeMulticall = useCallback(async () => {
        if (isInitialized) return

        try {
            setIsLoading(true)
            setIsError(false)
            console.log('🔄 Initializing Ethereum Multicall (one-time setup)')
            
            // Create direct providers instead of proxy providers
            const _providers = createDirectProviders()
            
            const _multicall: Record<number, OptimizedMulticall> = {}
            for (const chain of Object.keys(_providers)) {
                const chainId = Number(chain)
                _multicall[chainId] = new OptimizedMulticall({
                    ethersProvider: _providers[chainId],
                    tryAggregate: true,
                    multicallCustomContractAddress: MULTICALL_ADDRESSES[chainId],
                })
            }
            
            setMulticall(_multicall)
            setProviders(_providers)
            setIsInitialized(true)

            console.log('✅ Ethereum Multicall initialized for chains:', Object.keys(_providers))
            console.log('📊 Total providers created:', Object.keys(_providers).length)
        } catch (error) {
            console.error('❌ Ethereum Multicall initialization failed:', error)
            setIsError(true)
        } finally {
            setIsLoading(false)
        }
    }, [isInitialized])

    // Initialize once on mount
    useEffect(() => {
        initializeMulticall()
    }, [initializeMulticall])

    const ethMulticall = useCallback((
        calldata: ContractCallContext[],
        chainId: number,
        _multicall?: OptimizedMulticall
    ): Promise<ContractCallResults> => {
        const multicallInstance = _multicall || multicall[chainId]
        if (!multicallInstance) {
            return Promise.reject(new Error(`Multicall not available for chain ${chainId}`))
        }

        return new Promise(async (resolve, reject) => {
            try {
                const result = await multicallInstance.call(calldata)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }, [multicall])

    const fetchNativeBalance = useCallback((
        address: string,
        chainId: number
    ): Promise<BigNumber> => {
        const provider = providers[chainId]
        if (!provider) {
            return Promise.reject(new Error(`Provider not available for chain ${chainId}`))
        }

        return new Promise(async (resolve, reject) => {
            try {
                const result = await provider.getBalance(address)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }, [providers])

    const resetMulticall = useCallback(() => {
        setProviders({})
        setMulticall({})
        setIsInitialized(false)
        setIsError(false)
        console.log('🔄 Ethereum Multicall reset')
    }, [])

    const value: EthereumMulticallContextType = {
        providers,
        multicall,
        isLoading,
        isError,
        isInitialized,
        ethMulticall,
        fetchNativeBalance,
        resetMulticall,
        // Legacy methods for backward compatibility
        initializeMulticall,
        initalizeEthMulticall: () => {
            // Legacy method name with typo - just call the correct one
            initializeMulticall()
        },
    }

    return (
        <EthereumMulticallContext.Provider value={value}>
            {children}
        </EthereumMulticallContext.Provider>
    )
} 