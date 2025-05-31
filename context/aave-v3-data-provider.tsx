import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react'
import {
    ReservesDataHumanized,
    UiPoolDataProvider,
    UserReserveDataHumanized,
} from '@aave/contract-helpers'
import {
    ReservesDataHumanized as ReservesDataHumanizedLegacy,
    UserReserveDataHumanized as UserReserveDataHumanizedLegacy,
    UiPoolDataProvider as UiPoolDataProviderLegacy,
} from 'aave-contract-helpers-legacy'
import { getAddress } from 'ethers/lib/utils'
import { IsAaveV3Legacy } from '@/lib/utils'
import { useEthersMulticall } from '../hooks/useEthereumMulticall'
import { useAccount } from 'wagmi'

// Types for the context
type ReservesData = ReservesDataHumanized | ReservesDataHumanizedLegacy
type UserData = {
    userReserves: UserReserveDataHumanized[] | UserReserveDataHumanizedLegacy[]
    userEmodeCategoryId: number
}

interface ChainConfig {
    chainId: number
    uiPoolDataProviderAddress: string
    lendingPoolAddressProvider: string
}

interface CachedData {
    reserves?: ReservesData
    user?: UserData
    userByAddress?: Record<string, UserData> // Cache user data by address
    lastFetched: number
    isLoading: boolean
    error?: string
}

interface AaveV3DataContextType {
    // Data access
    getReservesData: (chainId: number) => ReservesData | undefined
    getUserData: (chainId: number, address?: string) => UserData | undefined
    
    // Combined data access
    getAaveData: (chainId: number) => [ReservesData?, UserData?]
    
    // Status checks
    isLoading: (chainId: number) => boolean
    hasError: (chainId: number) => string | undefined
    
    // Provider status
    providerStatus: {
        isReady: boolean
        isInitializing: boolean
        error: string | null
    }
    
    // Data fetching
    fetchData: (config: ChainConfig, forceRefresh?: boolean) => Promise<[ReservesData?, UserData?]>
    fetchReservesData: (config: ChainConfig, forceRefresh?: boolean) => Promise<ReservesData | undefined>
    fetchUserData: (config: ChainConfig, forceRefresh?: boolean, _walletAddress?: string) => Promise<UserData | undefined>
    
    // Cache management
    clearCache: (chainId?: number) => void
    refreshData: (config: ChainConfig) => Promise<void>
}

const AaveV3DataContext = createContext<AaveV3DataContextType | null>(null)

// Default context value to prevent undefined errors during initial render
const defaultContextValue: AaveV3DataContextType = {
    getReservesData: () => undefined,
    getUserData: () => undefined,
    getAaveData: () => [undefined, undefined],
    isLoading: () => false,
    hasError: () => undefined,
    providerStatus: {
        isReady: false,
        isInitializing: true,
        error: null,
    },
    fetchData: async () => [undefined, undefined],
    fetchReservesData: async () => undefined,
    fetchUserData: async () => undefined,
    clearCache: () => {},
    refreshData: async () => {},
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

interface AaveV3DataProviderProps {
    children: ReactNode
}

export const AaveV3DataProvider: React.FC<AaveV3DataProviderProps> = ({
    children,
}) => {
    const { address: walletAddress } = useAccount()
    const { providers } = useEthersMulticall()
    
    // Cache state: chainId -> cached data
    const [cache, setCache] = useState<Record<number, CachedData>>({})
    
    // Provider readiness state
    const [providerStatus, setProviderStatus] = useState({
        isReady: false,
        isInitializing: true,
        error: null as string | null,
    })

    // Enhanced provider readiness check
    useEffect(() => {
        const initializeProviders = async () => {
            setProviderStatus((prev) => ({ ...prev, isInitializing: true }))

            if (!providers || Object.keys(providers).length === 0) {
                setProviderStatus({
                    isReady: false,
                    isInitializing: false,
                    error: 'No providers available',
                })
                return
            }

            try {
                const chainIds = Object.keys(providers)
                const providerTests = await Promise.all(
                    chainIds.map(async (chainId) => {
                        const provider = providers[Number(chainId)]
                        if (!provider) return false

                        try {
                            await provider.getNetwork()
                            return true
                        } catch {
                            return false
                        }
                    })
                )

                const hasWorkingProvider = providerTests.some((result) => result)

                setProviderStatus({
                    isReady: hasWorkingProvider,
                    isInitializing: false,
                    error: hasWorkingProvider ? null : 'No working providers found',
                })
            } catch (error) {
                setProviderStatus({
                    isReady: false,
                    isInitializing: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error initializing providers',
                })
            }
        }

        initializeProviders()
    }, [providers])

    // Helper function to check if cache is valid
    const isCacheValid = useCallback((chainId: number, currentCache: Record<number, CachedData>): boolean => {
        const cached = currentCache[chainId]
        if (!cached) return false
        
        const now = Date.now()
        return (now - cached.lastFetched) < CACHE_DURATION
    }, [])

    // Helper function to update cache
    const updateCache = useCallback((
        chainId: number,
        updates: Partial<CachedData>
    ) => {
        setCache(prev => ({
            ...prev,
            [chainId]: {
                ...prev[chainId],
                ...updates,
                lastFetched: updates.lastFetched || prev[chainId]?.lastFetched || Date.now(),
            }
        }))
    }, [])

    // Fetch reserves data
    const fetchReservesData = useCallback(async (
        config: ChainConfig,
        forceRefresh = false
    ): Promise<ReservesData | undefined> => {
        const { chainId, uiPoolDataProviderAddress, lendingPoolAddressProvider } = config

        // Check cache first
        if (!forceRefresh && isCacheValid(chainId, cache) && cache[chainId]?.reserves) {
            return cache[chainId].reserves
        }

        if (!providerStatus.isReady || !providers || !providers[chainId]) {
            console.log('Provider not ready for fetchReservesData', {
                isProvidersReady: providerStatus.isReady,
                hasProviders: !!providers,
                chainSupported: providers?.[chainId] ? 'yes' : 'no',
            })
            return undefined
        }

        if (!uiPoolDataProviderAddress || !lendingPoolAddressProvider) {
            console.log('Missing required parameters for fetchReservesData')
            return undefined
        }

        // Set loading state
        updateCache(chainId, { isLoading: true, error: undefined })

        try {
            const isLegacyInstance = IsAaveV3Legacy(chainId)
            const uiPoolDataProviderInstance = isLegacyInstance
                ? new UiPoolDataProviderLegacy({
                      uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
                      provider: providers[chainId],
                      chainId: chainId,
                  })
                : new UiPoolDataProvider({
                      uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
                      provider: providers[chainId],
                      chainId: chainId,
                  })

            const result = await uiPoolDataProviderInstance.getReservesHumanized({
                lendingPoolAddressProvider: getAddress(lendingPoolAddressProvider),
            })

            // Update cache with result
            updateCache(chainId, {
                reserves: result,
                isLoading: false,
                error: undefined,
                lastFetched: Date.now(),
            })

            return result
        } catch (error) {
            console.error('Error in fetchReservesData:', error)
            updateCache(chainId, {
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
            return undefined
        }
    }, [providerStatus.isReady, providers, isCacheValid, updateCache])

    // Fetch user data
    const fetchUserData = useCallback(async (
        config: ChainConfig,
        forceRefresh = false,
        _walletAddress?: string
    ): Promise<UserData | undefined> => {
        const { chainId, uiPoolDataProviderAddress, lendingPoolAddressProvider } = config

        const addressToUse = _walletAddress || walletAddress
        if (!addressToUse) {
            console.log('No wallet address available for fetchUserData')
            return undefined
        }

        // Check cache first
        if (!forceRefresh) {
            if (_walletAddress) {
                // Check cache for specific address
                const cachedUserData = cache[chainId]?.userByAddress?.[_walletAddress]
                if (cachedUserData && isCacheValid(chainId, cache)) {
                    return cachedUserData
                }
            } else {
                // Check cache for current wallet
                if (cache[chainId]?.user && isCacheValid(chainId, cache)) {
                    return cache[chainId].user
                }
            }
        }

        if (!providerStatus.isReady || !providers || !providers[chainId]) {
            console.log('Provider not ready for fetchUserData')
            return undefined
        }

        if (!uiPoolDataProviderAddress || !lendingPoolAddressProvider) {
            console.log('Missing required parameters for fetchUserData')
            return undefined
        }

        // Set loading state (only for current wallet)
        if (!_walletAddress) {
            updateCache(chainId, { isLoading: true, error: undefined })
        }

        try {
            const isLegacyInstance = IsAaveV3Legacy(chainId)

            const uiPoolDataProviderInstance = isLegacyInstance
                ? new UiPoolDataProviderLegacy({
                      uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
                      provider: providers[chainId],
                      chainId: chainId,
                  })
                : new UiPoolDataProvider({
                      uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
                      provider: providers[chainId],
                      chainId: chainId,
                  })

            const result = await uiPoolDataProviderInstance.getUserReservesHumanized({
                lendingPoolAddressProvider: getAddress(lendingPoolAddressProvider),
                user: getAddress(addressToUse),
            })

            // Update cache with result
            if (_walletAddress) {
                // Cache for specific address
                updateCache(chainId, {
                    userByAddress: {
                        ...cache[chainId]?.userByAddress,
                        [_walletAddress]: result,
                    },
                    lastFetched: Date.now(),
                })
            } else {
                // Cache for current wallet
                updateCache(chainId, {
                    user: result,
                    isLoading: false,
                    error: undefined,
                    lastFetched: Date.now(),
                })
            }

            return result
        } catch (error) {
            console.error('Error in fetchUserData:', error)
            // Update cache with error (only for current wallet)
            if (!_walletAddress) {
                updateCache(chainId, {
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }
            return undefined
        }
    }, [providerStatus.isReady, providers, walletAddress, isCacheValid, updateCache])

    // Fetch both reserves and user data
    const fetchData = useCallback(async (
        config: ChainConfig,
        forceRefresh = false
    ): Promise<[ReservesData?, UserData?]> => {
        if (!providerStatus.isReady) {
            console.log('Providers not ready for fetchData')
            return [undefined, undefined]
        }

        try {
            const result = await Promise.all([
                fetchReservesData(config, forceRefresh),
                fetchUserData(config, forceRefresh),
            ])
            return result
        } catch (error) {
            console.error('Error in fetchData:', error)
            return [undefined, undefined]
        }
    }, [providerStatus.isReady, fetchReservesData, fetchUserData])

    // Data access methods
    const getReservesData = useCallback((chainId: number): ReservesData | undefined => {
        return cache[chainId]?.reserves
    }, [cache])

    const getUserData = useCallback((chainId: number, address?: string): UserData | undefined => {
        if (address) {
            return cache[chainId]?.userByAddress?.[address]
        }
        return cache[chainId]?.user
    }, [cache])

    const getAaveData = useCallback((chainId: number): [ReservesData?, UserData?] => {
        const cached = cache[chainId]
        return [cached?.reserves, cached?.user]
    }, [cache])

    // Status methods
    const isLoading = useCallback((chainId: number): boolean => {
        return cache[chainId]?.isLoading ?? false
    }, [cache])

    const hasError = useCallback((chainId: number): string | undefined => {
        return cache[chainId]?.error
    }, [cache])

    // Cache management
    const clearCache = useCallback((chainId?: number) => {
        if (chainId) {
            setCache(prev => {
                const newCache = { ...prev }
                delete newCache[chainId]
                return newCache
            })
        } else {
            setCache({})
        }
    }, [])

    const refreshData = useCallback(async (config: ChainConfig) => {
        await fetchData(config, true)
    }, [fetchData])

    // Clear cache when wallet changes
    useEffect(() => {
        clearCache()
    }, [walletAddress, clearCache])

    const contextValue: AaveV3DataContextType = {
        getReservesData,
        getUserData,
        getAaveData,
        isLoading,
        hasError,
        fetchData,
        fetchReservesData,
        fetchUserData,
        clearCache,
        refreshData,
        providerStatus,
    }

    return (
        <AaveV3DataContext.Provider value={contextValue}>
            {children}
        </AaveV3DataContext.Provider>
    )
}

// Custom hook to use the context
export const useAaveV3DataContext = () => {
    const context = useContext(AaveV3DataContext)
    if (!context) {
        // Return default context value instead of throwing error
        return defaultContextValue
    }
    return context
}

// Export types for external use
export type { ChainConfig, ReservesData, UserData } 