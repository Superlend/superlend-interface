import { BigNumber } from 'ethers'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from 'ethereum-multicall'
import { MULTICALL_ADDRESSES } from '../lib/constants'
import { createDirectProviders } from '@/lib/direct-providers'
import { providers } from 'ethers'
import { SUPPORTED_CHAIN_IDS } from '@/constants'

// Override Multicall to optimize RPC calls
export class OptimizedMulticall extends Multicall {
  async call(contractCallContexts: ContractCallContext[]): Promise<ContractCallResults> {
    // Use the original call method for small batches
    if (contractCallContexts.length <= 5) {
      return super.call(contractCallContexts);
    }
    
    // For larger batches, split into chunks to avoid rate limiting
    const chunks = this.chunkArray(contractCallContexts, 5);
    const results: ContractCallResults[] = [];
    
    for (const chunk of chunks) {
      // Add a small delay between chunks to avoid rate limiting
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const result = await super.call(chunk);
      results.push(result);
    }
    
    // Merge results
    return this.mergeResults(results);
  }
  
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  private mergeResults(results: ContractCallResults[]): ContractCallResults {
    // Use the blockNumber from the first result or default to 0
    const blockNumber = results.length > 0 ? results[0].blockNumber : 0;
    const merged: ContractCallResults = { 
      results: {},
      blockNumber 
    };
    
    for (const result of results) {
      merged.results = { ...merged.results, ...result.results };
    }
    
    return merged;
  }
}

// ✅ SINGLETON PATTERN - Shared across all hook instances
class MulticallManager {
    private static instance: MulticallManager | null = null
    private providers: Record<number, providers.JsonRpcProvider> = {}
    private multicall: Record<number, OptimizedMulticall> = {}
    private isInitialized = false
    private isInitializing = false
    private initPromise: Promise<void> | null = null

    static getInstance(): MulticallManager {
        if (!MulticallManager.instance) {
            MulticallManager.instance = new MulticallManager()
        }
        return MulticallManager.instance
    }

    async initialize(): Promise<void> {
        // Prevent multiple simultaneous initializations
        if (this.isInitialized) return
        if (this.isInitializing && this.initPromise) return this.initPromise

        this.isInitializing = true
        this.initPromise = this.doInitialize()
        
        try {
            await this.initPromise
        } finally {
            this.isInitializing = false
            this.initPromise = null
        }
    }

    private async doInitialize(): Promise<void> {
        try {
            console.log('🔄 Initializing MulticallManager (one-time setup)')
            
            // Create direct providers instead of proxy providers
            const _providers = createDirectProviders();
            
            const _multicall: Record<number, OptimizedMulticall> = {}
            for (const chain of Object.keys(_providers)) {
                const chainId = Number(chain)
                _multicall[chainId] = new OptimizedMulticall({
                    ethersProvider: _providers[chainId],
                    tryAggregate: true,
                    multicallCustomContractAddress: MULTICALL_ADDRESSES[Number(chain)],
                })
            }
            
            this.multicall = _multicall
            this.providers = _providers
            this.isInitialized = true

            console.log('✅ MulticallManager initialized for chains:', Object.keys(_providers))
        } catch (error) {
            console.error('❌ MulticallManager initialization failed:', error)
            this.isInitialized = false
            throw error
        }
    }

    getProviders(): Record<number, providers.JsonRpcProvider> {
        return this.providers
    }

    getMulticall(): Record<number, OptimizedMulticall> {
        return this.multicall
    }

    getIsInitialized(): boolean {
        return this.isInitialized
    }

    reset(): void {
        this.providers = {}
        this.multicall = {}
        this.isInitialized = false
        this.isInitializing = false
        this.initPromise = null
        console.log('🔄 MulticallManager reset')
    }
}

export const useEthersMulticall = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isError, setIsError] = useState(false)
    const managerRef = useRef<MulticallManager>(MulticallManager.getInstance())
    const [isInitialized, setIsInitialized] = useState(false)

    // ✅ FIXED: Initialize only once, no infinite loop
    const initializeMulticall = useCallback(async () => {
        if (managerRef.current.getIsInitialized()) {
            setIsInitialized(true)
            return
        }

        try {
            setIsLoading(true)
            setIsError(false)
            await managerRef.current.initialize()
            setIsInitialized(true)
        } catch (error) {
            console.error('Multicall initialization error:', error)
            setIsError(true)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // ✅ FIXED: Only initialize once on mount
    useEffect(() => {
        initializeMulticall()
    }, [initializeMulticall])

    const ethMulticall = useCallback((
        calldata: ContractCallContext[],
        chainId: number,
        _multicall?: OptimizedMulticall
    ): Promise<ContractCallResults> => {
        const multicallInstance = _multicall || managerRef.current.getMulticall()[chainId]
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
    }, [])

    const fetchNativeBalance = useCallback((
        address: string,
        chainId: number
    ): Promise<BigNumber> => {
        const provider = managerRef.current.getProviders()[chainId]
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
    }, [])

    // ✅ Reset function for wallet disconnection
    const resetMulticall = useCallback(() => {
        managerRef.current.reset()
        setIsInitialized(false)
        setIsError(false)
    }, [])

    return {
        // Getters for providers/multicall (always current)
        providers: managerRef.current.getProviders(),
        multicall: managerRef.current.getMulticall(),
        
        // State
        isLoading,
        isError,
        isInitialized,
        
        // Actions
        ethMulticall,
        fetchNativeBalance,
        initializeMulticall,
        resetMulticall,
    }
}
