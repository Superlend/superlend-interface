import { providers } from 'ethers';

// Your Alchemy API key - using NEXT_PUBLIC_ prefix for client-side access
const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY;

// Fallback check for the API key
if (!ALCHEMY_KEY) {
  console.error('NEXT_PUBLIC_ALCHEMY_KEY environment variable is not set');
}

// Direct RPC provider URLs using Alchemy endpoints
const RPC_URLS: Record<number, string> = {
  1: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,           // Ethereum Mainnet
  10: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,          // Optimism
  56: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,          // BNB Smart Chain
  100: `https://gnosis-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,      // Gnosis Chain
  137: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,     // Polygon PoS
  1088: `https://metis-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,      // Metis
  8453: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,       // Base
  42161: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,       // Arbitrum One
  42793: `https://node.mainnet.etherlink.com`, // Etherlink (custom RPC)
  43114: `https://avax-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,      // Avalanche C-Chain
  534352: `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,   // Scroll
  59144: `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,     // Linea
  146: `https://sonic-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,       // Sonic
};

// Create direct providers for all supported chains
export function createDirectProviders(): Record<number, providers.JsonRpcProvider> {
  const directProviders: Record<number, providers.JsonRpcProvider> = {};
  
  for (const [chainId, rpcUrl] of Object.entries(RPC_URLS)) {
    directProviders[Number(chainId)] = new providers.JsonRpcProvider(rpcUrl);
  }
  
  return directProviders;
}

// Export individual provider getter
export function getDirectProvider(chainId: number): providers.JsonRpcProvider | null {
  const url = RPC_URLS[chainId];
  if (!url) return null;
  
  return new providers.JsonRpcProvider(url);
}

// Export RPC URLs for Wagmi configuration
export { RPC_URLS }; 