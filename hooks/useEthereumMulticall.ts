import { BigNumber } from 'ethers'
import { useEffect, useState } from 'react'
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from 'ethereum-multicall'
import { MULTICALL_ADDRESSES } from '../lib/constants'
import { ProxyProvider } from '@/lib/proxy-provider'
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

export const useEthersMulticall = () => {
    const [providers, setProviders] = useState<
        Record<number, ProxyProvider>
    >({})
    const [multicall, setMulticall] = useState<Record<number, OptimizedMulticall>>({})
    const [isLoading, setIsLoading] = useState<Boolean>(false)
    const [isError, setIsError] = useState(false)

    const initalizeEthMulticall = () => {
        try {
            // if (isLoading) return
            setIsLoading(true)
            
            // Create providers using our secure proxy
            const chainIds = SUPPORTED_CHAIN_IDS;
            const _providers: Record<number, ProxyProvider> = {};
            
            for (const chainId of chainIds) {
                _providers[chainId] = new ProxyProvider(chainId);
            }

            const _multicall: Record<number, OptimizedMulticall> = {}
            for (const chain of Object.keys(_providers)) {
                const chainId = Number(chain)
                _multicall[chainId] = new OptimizedMulticall({
                    ethersProvider: _providers[chainId],
                    tryAggregate: true,
                    multicallCustomContractAddress:
                        MULTICALL_ADDRESSES[Number(chain)],
                })
            }
            setMulticall(_multicall)
            setProviders(_providers)
            setIsLoading(false)

            return _multicall
        } catch (error) {
            console.log(error)
            setIsError(true)
            setIsLoading(false)
        }
    }

    const ethMulticall = (
        calldata: ContractCallContext[],
        chainId: number,
        _multicall?: OptimizedMulticall
    ): Promise<ContractCallResults> => {
        let multicallProvider: OptimizedMulticall = _multicall || multicall[chainId]
        if (!multicallProvider) {
            return undefined as any
        }
        return new Promise(async (resolve, reject) => {
            try {
                const result = await multicallProvider.call(calldata)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

    const fetchNativeBalance = (
        address: string,
        chainId: number
    ): Promise<BigNumber> => {
        const provider = providers[chainId]
        if (!provider) return undefined as any

        return new Promise(async (resolve, reject) => {
            try {
                const result = await provider.getBalance(address)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

    useEffect(() => {
        if (!Object.keys(providers).length || !Object.keys(multicall).length) {
            initalizeEthMulticall()
        }
    }, [providers, multicall, isError])

    return {
        providers,
        setProviders,
        multicall,
        setMulticall,
        ethMulticall,
        fetchNativeBalance,
        initalizeEthMulticall,
    }
}
