'use client';

import { useEffect } from 'react';
import { prefetchBlockchainData } from '@/lib/blockchain-prefetch';
import { useWalletStatus } from '@/hooks/useWallet';

/**
 * Component that prefetches blockchain data for commonly used chains
 * to reduce API calls and the risk of rate limiting
 * Only runs when a wallet is connected
 */
export function BlockchainDataPrefetcher() {
  const { isConnected } = useWalletStatus();

  useEffect(() => {
    // Only prefetch when wallet is connected
    if (!isConnected) {
      return;
    }

    // Most commonly used chains (adjust based on your app's needs)
    const commonChains = [1, 10, 137, 42161, 8453];
    
    // Initial prefetch with a short delay to allow the page to load first
    const initialTimer = setTimeout(() => {
      prefetchBlockchainData(commonChains);
    }, 1000);
    
    // Set up periodic prefetch every 5 minutes
    const intervalId = setInterval(() => {
      prefetchBlockchainData(commonChains);
    }, 5 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [isConnected]);
  
  // This component doesn't render anything
  return null;
} 