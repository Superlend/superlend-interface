# Aave V3 Data Context Migration Guide

## Overview

The Aave V3 data management has been refactored to use a centralized context provider that eliminates duplicate API calls and provides better caching. This document explains how to use the new system and migrate from the old approach.

## Key Benefits

1. **Eliminated Duplicate API Calls**: The context prevents multiple components from making the same API calls
2. **Smart Caching**: Data is cached for 5 minutes per chain, reducing unnecessary network requests
3. **Better Error Handling**: Centralized error states and loading indicators
4. **Chain-Aware**: Properly handles data for multiple chains simultaneously
5. **Automatic Cache Invalidation**: Cache is automatically cleared when wallet address changes

## Usage Examples

### Basic Usage (Recommended)

```typescript
import { useAaveV3DataContext } from '@/context/aave-v3-data-provider'

function MyComponent() {
    const {
        getReservesData,
        getUserData,
        fetchData,
        isLoading,
        hasError,
        refreshData,
        providerStatus
    } = useAaveV3DataContext()

    const chainId = 42793 // Etherlink
    const config = {
        chainId,
        uiPoolDataProviderAddress: '0x9f9384ef6a1a76ae1a95df483be4b0214fda0ef9',
        lendingPoolAddressProvider: '0x5ccf60c7e10547c5389e9cbff543e5d0db9f4fec'
    }

    // Fetch data only when providers are ready
    useEffect(() => {
        if (providerStatus.isReady) {
            fetchData(config)
        }
    }, [providerStatus.isReady])

    // Handle provider initialization states
    if (providerStatus.isInitializing) {
        return <div>Initializing providers...</div>
    }

    if (providerStatus.error) {
        return <div>Provider Error: {providerStatus.error}</div>
    }

    // Get cached data
    const reservesData = getReservesData(chainId)
    const userData = getUserData(chainId)
    
    // Check data loading status
    const loading = isLoading(chainId)
    const error = hasError(chainId)

    if (loading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div>
            {/* Use reservesData and userData */}
        </div>
    )
}
```

### Force Refresh Data

```typescript
function RefreshButton() {
    const { refreshData } = useAaveV3DataContext()
    
    const handleRefresh = async () => {
        await refreshData(config)
    }
    
    return <button onClick={handleRefresh}>Refresh Data</button>
}
```

### Backwards Compatibility

The existing `useAaveV3Data` hook still works but now uses the context internally:

```typescript
import { useAaveV3Data } from '@/hooks/protocols/useAaveV3Data'

function LegacyComponent() {
    const {
        // New context methods (recommended)
        getReservesData,
        getUserData,
        fetchData,
        
        // Legacy methods (still work)
        fetchAaveV3Data,
        getMaxBorrowAmount,
        getMaxWithdrawAmount
    } = useAaveV3Data()
    
    // Both approaches work, but context methods are preferred
}
```

## Migration Steps

### 1. Update Provider Setup (Already Done)

The `AaveV3DataProvider` has been added to the app's context providers in `context/index.tsx`.

### 2. Update Components

**Before:**
```typescript
function Component() {
    const { reserveData, userData, fetchAaveV3Data } = useAaveV3Data()
    
    useEffect(() => {
        fetchAaveV3Data(chainId, uiProvider, lendingProvider)
    }, [])
    
    // reserveData and userData might be undefined
}
```

**After (Recommended):**
```typescript
function Component() {
    const { getReservesData, getUserData, fetchData } = useAaveV3DataContext()
    
    useEffect(() => {
        fetchData({
            chainId,
            uiPoolDataProviderAddress: uiProvider,
            lendingPoolAddressProvider: lendingProvider
        })
    }, [])
    
    const reserveData = getReservesData(chainId)
    const userData = getUserData(chainId)
}
```

## API Reference

### AaveV3DataContext Methods

#### Data Access
- `getReservesData(chainId: number)` - Get cached reserves data for a chain
- `getUserData(chainId: number)` - Get cached user data for a chain  
- `getAaveData(chainId: number)` - Get both reserves and user data as tuple

#### Status Checks
- `isLoading(chainId: number)` - Check if data is currently loading
- `hasError(chainId: number)` - Get error message if any
- `providerStatus` - Provider readiness state with `isReady`, `isInitializing`, and `error` properties

#### Data Fetching
- `fetchData(config: ChainConfig, forceRefresh?: boolean)` - Fetch both reserves and user data
- `fetchReservesData(config: ChainConfig, forceRefresh?: boolean)` - Fetch only reserves data
- `fetchUserData(config: ChainConfig, forceRefresh?: boolean)` - Fetch only user data

#### Cache Management
- `refreshData(config: ChainConfig)` - Force refresh data (equivalent to `fetchData(config, true)`)
- `clearCache(chainId?: number)` - Clear cache for specific chain or all chains

### ChainConfig Interface

```typescript
interface ChainConfig {
    chainId: number
    uiPoolDataProviderAddress: string
    lendingPoolAddressProvider: string
}
```

## Caching Behavior

- **Cache Duration**: 5 minutes per chain
- **Cache Key**: Based on chainId, provider addresses, and wallet address
- **Automatic Invalidation**: Cache is cleared when wallet address changes
- **Manual Refresh**: Use `forceRefresh: true` or `refreshData()` to bypass cache

## Error Handling

Errors are stored per chain and can be accessed via:

```typescript
const error = hasError(chainId)
if (error) {
    console.error('Aave data error:', error)
}
```

## Provider Status Handling

The `providerStatus` is crucial for handling edge cases related to provider initialization:

```typescript
const { providerStatus, fetchData } = useAaveV3DataContext()

// Check if providers are still initializing
if (providerStatus.isInitializing) {
    return <div>Initializing blockchain providers...</div>
}

// Check if providers failed to initialize
if (providerStatus.error) {
    return <div>Provider Error: {providerStatus.error}</div>
}

// Only fetch data when providers are ready
if (providerStatus.isReady) {
    fetchData(config)
}
```

### Important Edge Cases Handled by Provider Status:

1. **Network Connectivity Issues**: When blockchain providers can't connect
2. **RPC Endpoint Failures**: When configured RPC endpoints are down
3. **Chain Configuration Problems**: When chain setup is incorrect
4. **Wallet Provider Issues**: When wallet providers fail to initialize

## Performance Benefits

1. **Reduced Network Calls**: Multiple components requesting the same data will use cached results
2. **Faster UI Updates**: Cached data is available immediately
3. **Better UX**: Loading states are managed centrally
4. **Memory Efficient**: Old cache entries are automatically cleaned up

## Best Practices

1. Always use the context methods for new components
2. Prefer `getReservesData(chainId)` over legacy state variables
3. Use `isLoading(chainId)` and `hasError(chainId)` for status checks
4. Only force refresh when necessary (user action, error recovery)
5. Clear cache when switching between different environments

## Troubleshooting

### Provider Issues
- **Provider Not Ready**: Check `providerStatus.isReady` before making data calls
- **Provider Initialization Errors**: Look at `providerStatus.error` for specific error messages
- **Stuck Initializing**: May indicate network connectivity issues or invalid RPC endpoints
- **Provider Readiness**: Ensure your wallet is connected and the correct network is selected

### Data Not Loading
- Check if `AaveV3DataProvider` is properly wrapped around your component tree
- Verify the `ChainConfig` parameters are correct
- Check browser console for error messages
- Ensure `providerStatus.isReady` is true before fetching data

### Stale Data
- Use `refreshData(config)` to force a refresh
- Check if cache duration (5 minutes) is appropriate for your use case

### Performance Issues
- Avoid calling `fetchData` in render loops
- Use `useEffect` with proper dependencies for data fetching
- Consider using `isLoading` to prevent unnecessary re-renders
- Always check `providerStatus.isReady` before making API calls