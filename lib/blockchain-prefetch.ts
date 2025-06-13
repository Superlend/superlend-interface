import { getDirectProvider } from './direct-providers';
import { providers } from 'ethers';

// Store for prefetched data
const prefetchStore: Record<string, any> = {};

/**
 * Prefetch common blockchain data to reduce API calls during app usage
 * @param chainIds Array of chain IDs to prefetch data for
 */
export async function prefetchBlockchainData(chainIds: number[]): Promise<void> {
  try {
    console.log('Prefetching blockchain data...');
    
    // Create providers for each chain
    const providersRecord: Record<number, providers.JsonRpcProvider> = {};
    for (const chainId of chainIds) {
      const provider = getDirectProvider(chainId);
      if (provider) {
        providersRecord[chainId] = provider;
      }
    }
    
    // Prefetch in parallel for all chains
    await Promise.all(chainIds.map(async (chainId) => {
      const provider = providersRecord[chainId];
      if (!provider) {
        console.warn(`No provider available for chain ${chainId}`);
        return;
      }
      
      try {
        // Prefetch latest block
        const blockNumber = await provider.getBlockNumber();
        
        // Prefetch block data
        const block = await provider.getBlock(blockNumber);
        
        // Store prefetched data
        const chainKey = `chain_${chainId}`;
        prefetchStore[chainKey] = {
          blockNumber,
          block,
          timestamp: Date.now(),
        };
        
        console.log(`Prefetched data for chain ${chainId}, block ${blockNumber}`);
      } catch (error) {
        console.error(`Error prefetching data for chain ${chainId}:`, error);
      }
    }));
    
    console.log('Blockchain data prefetch complete');
  } catch (error) {
    console.error('Error during blockchain data prefetch:', error);
  }
}

/**
 * Get prefetched data if available
 * @param chainId Chain ID to get data for
 * @param dataType Type of data to retrieve
 * @returns Prefetched data or null if not available
 */
export function getPrefetchedData(chainId: number, dataType: string): any {
  const chainKey = `chain_${chainId}`;
  const data = prefetchStore[chainKey];
  
  if (!data) return null;
  
  // Check if data is fresh enough (5 minutes)
  if (Date.now() - data.timestamp > 300000) return null;
  
  return data[dataType] || null;
} 