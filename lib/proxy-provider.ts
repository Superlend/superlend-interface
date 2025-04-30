// lib/proxy-provider.ts
import { providers } from 'ethers';
import { addCsrfToHeaders } from './csrf-service';

// Enhanced cache implementation with longer TTLs
interface CacheEntry {
  result: any;
  timestamp: number;
}

// Longer cache TTLs to reduce request frequency
const CACHE_TTL: Record<string, number> = {
  // Chain metadata (rarely changes)
  net_version: 3600000, // 1 hour
  eth_chainId: 3600000, // 1 hour
  eth_getCode: 3600000, // 1 hour
  
  // Block data
  eth_getBlockByNumber: 12000, // 12 seconds (average block time)
  eth_getBlockByHash: 12000,   // 12 seconds
  
  // Balance/state data
  eth_getBalance: 30000,       // 30 seconds
  eth_getStorageAt: 30000,     // 30 seconds
  
  // Default for other methods
  default: 20000,              // 20 seconds
};

// Global request cache shared across provider instances
const requestCache: Record<string, CacheEntry> = {};

// In-memory request queue to prevent concurrent similar requests
const pendingRequests: Record<string, Promise<any>> = {};

/**
 * Custom JsonRpcProvider that uses our server-side proxy
 * with enhanced caching and retry logic
 */
export class ProxyProvider extends providers.JsonRpcProvider {
  private chainId: number;
  
  constructor(chainId: number) {
    // The URL doesn't matter as we override the send method
    super('');
    this.chainId = chainId;
  }
  
  async send(method: string, params: Array<any>): Promise<any> {
    try {
      // Methods that should never be cached
      const nonCacheableMethods = [
        'eth_sendTransaction', 
        'eth_sendRawTransaction',
        'eth_estimateGas',
        'personal_sign',
        'eth_sign',
        'eth_signTypedData',
      ];
      
      // Methods that need fresh data but can still be cached briefly
      const shortCacheMethods = [
        'eth_call',
        'eth_getTransactionCount',
        'eth_gasPrice',
        'eth_getTransactionReceipt',
      ];
      
      // Check if method is cacheable
      const isCacheable = !nonCacheableMethods.includes(method);
      const ttl = shortCacheMethods.includes(method) 
        ? 5000  // Short cache for methods needing fresher data
        : (CACHE_TTL[method] || CACHE_TTL.default);
      
      // Create cache key from chainId, method, and params
      const cacheKey = `${this.chainId}:${method}:${JSON.stringify(params)}`;
      
      if (isCacheable) {
        const now = Date.now();
        const cachedData = requestCache[cacheKey];
        
        // Return cached data if available and not expired
        if (cachedData && (now - cachedData.timestamp) < ttl) {
          return cachedData.result;
        }
        
        // Check if there's already a pending request for this exact data
        const pendingRequest = pendingRequests[cacheKey];
        if (pendingRequest) {
          return pendingRequest;
        }
      }
      
      // Function to make the actual request with retry logic
      const makeRequest = async (retryCount = 0, delay = 1000): Promise<any> => {
        try {
          // Get headers with CSRF token
          const headers = await addCsrfToHeaders({
            'Content-Type': 'application/json',
          });
          
          const response = await fetch('/api/rpc-proxy', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              chainId: this.chainId,
              method,
              params,
            }),
          });
          
          // Handle 403 errors from invalid CSRF tokens
          if (response.status === 403) {
            const responseData = await response.json();
            if (responseData.error?.includes('CSRF')) {
              if (retryCount < 2) {
                // Try to fetch a new CSRF token and retry
                console.log('Invalid CSRF token, fetching a new one and retrying...');
                // Refresh token explicitly by importing directly
                // This avoids circular dependencies
                const { fetchCsrfToken } = await import('./csrf-service');
                await fetchCsrfToken();
                
                // Short delay before retry
                await new Promise(resolve => setTimeout(resolve, 100));
                return makeRequest(retryCount + 1, delay);
              } else {
                throw new Error('CSRF validation failed after retries');
              }
            }
          }
          
          // If rate limited, retry with exponential backoff
          if (response.status === 429) {
            if (retryCount < 3) {
              // Exponential backoff with jitter
              const jitter = Math.random() * 500;
              const newDelay = delay * 2 + jitter;
              console.log(`Rate limited, retrying in ${newDelay}ms (attempt ${retryCount + 1})`);
              
              await new Promise(resolve => setTimeout(resolve, newDelay));
              return makeRequest(retryCount + 1, newDelay);
            } else {
              throw new Error(`Rate limit exceeded after ${retryCount} retries`);
            }
          }
          
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Cache the successful result if method is cacheable
          if (isCacheable) {
            requestCache[cacheKey] = {
              result: data.result,
              timestamp: Date.now(),
            };
          }
          
          return data.result;
        } catch (error: any) {
          if (retryCount < 3 && (
            error.message?.includes('Rate limit') || 
            error.message?.includes('CSRF')
          )) {
            // Retry with exponential backoff
            const newDelay = delay * 2 + Math.random() * 500;
            await new Promise(resolve => setTimeout(resolve, newDelay));
            return makeRequest(retryCount + 1, newDelay);
          }
          throw error;
        }
      };
      
      // Store the promise in pendingRequests to deduplicate concurrent calls
      if (isCacheable) {
        const requestPromise = makeRequest();
        pendingRequests[cacheKey] = requestPromise;
        
        try {
          const result = await requestPromise;
          delete pendingRequests[cacheKey]; // Clean up after completed
          return result;
        } catch (error) {
          delete pendingRequests[cacheKey]; // Clean up after error
          throw error;
        }
      } else {
        // Non-cacheable methods don't need deduplication
        return makeRequest();
      }
    } catch (error) {
      console.error('RPC request failed:', error);
      throw error;
    }
  }
}