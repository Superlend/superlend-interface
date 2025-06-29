import React, { useEffect, useState } from 'react'
import { useAaveV3DataContext, type ChainConfig } from '@/context/aave-v3-data-provider'
import { etherlink } from 'viem/chains'

// Example configuration for Etherlink
const ETHERLINK_CONFIG: ChainConfig = {
    chainId: etherlink.id,
    uiPoolDataProviderAddress: '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
    lendingPoolAddressProvider: '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec'
}

/**
 * Example component showing how to use the new Aave V3 context
 */
export function AaveV3ContextExample() {
    const {
        getReservesData,
        getUserData,
        getAaveData,
        fetchData,
        isLoading,
        hasError,
        refreshData,
        providerStatus,
    } = useAaveV3DataContext()

    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    
    // Fetch data only when providers are ready
    useEffect(() => {
        if (providerStatus.isReady) {
            fetchData(ETHERLINK_CONFIG)
        }
    }, [fetchData, providerStatus.isReady])

    // Handle provider initialization states first
    if (providerStatus.isInitializing) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                    <span className="text-yellow-800">Initializing blockchain providers...</span>
                </div>
            </div>
        )
    }

    if (providerStatus.error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold">Provider Initialization Error</h3>
                <p className="text-red-600 mt-1">{providerStatus.error}</p>
                <p className="text-sm text-red-500 mt-2">
                    Please check your network connection and try refreshing the page.
                </p>
            </div>
        )
    }

    if (!providerStatus.isReady) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600">Providers not ready yet...</span>
            </div>
        )
    }

    // Get data from context (will be undefined until loaded)
    const reservesData = getReservesData(ETHERLINK_CONFIG.chainId)
    const userData = getUserData(ETHERLINK_CONFIG.chainId)
    
    // Or get both at once
    const [reserves, user] = getAaveData(ETHERLINK_CONFIG.chainId)
    
    // Check status
    const loading = isLoading(ETHERLINK_CONFIG.chainId)
    const error = hasError(ETHERLINK_CONFIG.chainId)

    const handleRefresh = async () => {
        await refreshData(ETHERLINK_CONFIG)
        setLastRefresh(new Date())
    }

    const handleForceRefresh = async () => {
        await fetchData(ETHERLINK_CONFIG, true) // Force refresh bypasses cache
        setLastRefresh(new Date())
    }

    if (loading) {
        return (
            <div className="p-4 bg-blue-50 rounded-lg">
                <div className="animate-pulse">Loading Aave V3 data...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button 
                    onClick={handleRefresh}
                    className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Aave V3 Data Example</h2>
                <div className="space-x-2">
                    <button 
                        onClick={handleRefresh}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                    <button 
                        onClick={handleForceRefresh}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Force Refresh
                    </button>
                </div>
            </div>

            {lastRefresh && (
                <div className="text-sm text-gray-600">
                    Last refreshed: {lastRefresh.toLocaleTimeString()}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reserves Data Section */}
                <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Reserves Data</h3>
                    {reservesData ? (
                        <div className="space-y-2">
                            <p><strong>Total Reserves:</strong> {reservesData.reservesData.length}</p>
                            <p><strong>Market Currency:</strong> {reservesData.baseCurrencyData.marketReferenceCurrencyPriceInUsd}</p>
                            <div className="max-h-32 overflow-y-auto">
                                <h4 className="font-medium">Available Tokens:</h4>
                                {reservesData.reservesData.slice(0, 5).map((reserve, index) => (
                                    <div key={index} className="text-sm text-gray-600">
                                        {reserve.symbol} - {reserve.name}
                                    </div>
                                ))}
                                {reservesData.reservesData.length > 5 && (
                                    <div className="text-sm text-gray-500">
                                        ... and {reservesData.reservesData.length - 5} more
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No reserves data available</p>
                    )}
                </div>

                {/* User Data Section */}
                <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">User Data</h3>
                    {userData ? (
                        <div className="space-y-2">
                            <p><strong>User Reserves:</strong> {userData.userReserves.length}</p>
                            <p><strong>E-Mode Category:</strong> {userData.userEmodeCategoryId}</p>
                            {userData.userReserves.length > 0 ? (
                                <div className="max-h-32 overflow-y-auto">
                                    <h4 className="font-medium">Active Positions:</h4>
                                    {userData.userReserves.map((userReserve, index) => (
                                        <div key={index} className="text-sm text-gray-600">
                                            {userReserve.underlyingAsset.slice(0, 6)}...{userReserve.underlyingAsset.slice(-4)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No active positions</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">No user data available</p>
                    )}
                </div>
            </div>

            {/* Cache Status */}
            <div className="p-3 bg-gray-50 rounded text-sm">
                <strong>Cache Status:</strong> Data is cached for 5 minutes. 
                Use "Refresh" to get data from cache or "Force Refresh" to bypass cache.
            </div>
        </div>
    )
}

/**
 * Example showing how to use with the legacy useAaveV3Data hook
 */
export function LegacyHookExample() {
    // Import the old hook - it now uses the context internally
    const { useAaveV3Data } = require('@/hooks/protocols/useAaveV3Data')
    
    const {
        // New context methods (recommended)
        getReservesData,
        getUserData,
        fetchData,
        isLoading,
        hasError,
        
        // Legacy methods (still work but deprecated)
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getMaxWithdrawAmount,
        
        // Legacy state (now returns undefined - use context methods instead)
        reserveData, // deprecated
        userData, // deprecated
    } = useAaveV3Data()

    useEffect(() => {
        // New way (recommended)
        fetchData(ETHERLINK_CONFIG)
        
        // Old way (still works but not recommended)
        // fetchAaveV3Data(
        //     ETHERLINK_CONFIG.chainId,
        //     ETHERLINK_CONFIG.uiPoolDataProviderAddress,
        //     ETHERLINK_CONFIG.lendingPoolAddressProvider
        // )
    }, [])

    // Get data using new context methods
    const reserves = getReservesData(ETHERLINK_CONFIG.chainId)
    const user = getUserData(ETHERLINK_CONFIG.chainId)

    return (
        <div className="p-4">
            <h3>Legacy Hook Example</h3>
            <p>Using both old and new patterns for backwards compatibility</p>
            {reserves && <p>Reserves loaded: {reserves.reservesData.length} tokens</p>}
            {user && <p>User reserves: {user.userReserves.length} positions</p>}
        </div>
    )
}

export default AaveV3ContextExample 