import { BigNumber } from 'ethers'
import {
    ContractCallContext,
    ContractCallResults,
    Multicall,
} from 'ethereum-multicall'
import { MULTICALL_ADDRESSES } from '../lib/constants'
import { providers } from 'ethers'
import { useEthereumMulticallContext } from '../context/ethereum-multicall-provider'

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
    // Use the shared context instead of creating new instances
    return useEthereumMulticallContext()
}