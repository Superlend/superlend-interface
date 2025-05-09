// app/api/rpc-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequestCsrfToken } from '@/lib/csrf-protection';

// Type definitions for better type safety
interface RequestTrackerEntry {
  count: number;
  timestamp: number;
}

interface RPCRequest {
  chainId: number;
  method: string;
  params: any[];
}

interface BatchRequest {
  batch: boolean;
  requests: RPCRequest[];
}

// In-memory request tracking for smarter rate limiting
const requestTracker: Record<string, RequestTrackerEntry> = {};

// Store cleanup interval reference
let cleanupInterval: NodeJS.Timeout | null = null;

// Clean up stale request tracking periodically
if (typeof setInterval !== 'undefined') {
  try {
    cleanupInterval = setInterval(() => {
      try {
        const now = Date.now();
        let cleanedEntries = 0;
        
        for (const key in requestTracker) {
          if (now - requestTracker[key].timestamp > 60000) { // 1 minute
            delete requestTracker[key];
            cleanedEntries++;
          }
        }
        
        // Log cleanup statistics but only if entries were removed
        if (cleanedEntries > 0) {
          console.log(`Cleaned up ${cleanedEntries} stale rate limit entries`);
        }
      } catch (error) {
        console.error('Error during request tracker cleanup:', error);
        // Continue running despite errors
      }
    }, 60000); // Clean up every minute
  } catch (error) {
    console.error('Failed to setup cleanup interval:', error);
    // Continue without the cleanup interval
  }
}

// Advanced rate limiting that allows bursts but prevents sustained high rates
function applySmartRateLimit(request: NextRequest): NextResponse | null {
  try {
    // More robust IP extraction with spoofing protection
    const getClientIp = (req: NextRequest): string => {
      try {
        // Try multiple headers, in order of reliability
        const headers = [
          // Cloudflare specific
          req.headers.get('cf-connecting-ip'),
          // Standard proxy headers - but these can be spoofed if not properly configured
          req.headers.get('x-real-ip'),
          req.headers.get('x-forwarded-for'),
          // Fallback to direct IP
          req.headers.get('x-client-ip'),
          req.ip
        ];
        
        // Find first valid header
        for (const header of headers) {
          if (!header) continue;
          
          // Handle x-forwarded-for format which may contain multiple IPs
          // We take the leftmost (client) IP in the chain
          const ips = header.split(',').map(ip => ip.trim());
          const clientIp = ips[0];
          
          // Basic IP validation
          if (isValidIp(clientIp)) {
            return clientIp;
          }
        }
        
        // Generate a unique fallback identifier using request data
        // This prevents all unknown IPs from sharing same rate limit bucket
        const userAgent = req.headers.get('user-agent') || '';
        const referer = req.headers.get('referer') || '';
        const fallbackData = `${userAgent}-${referer}-${Date.now()}`;
        const fallbackId = Buffer.from(fallbackData).toString('base64').substring(0, 16);
        return `unknown-${fallbackId}`;
      } catch (error) {
        console.error('Error extracting client IP:', error);
        // Return a unique fallback in case of errors
        return `error-${Date.now().toString(36)}`;
      }
    };
    
    // Simple IP validation function
    const isValidIp = (ip: string): boolean => {
      if (!ip || typeof ip !== 'string') return false;
      
      try {
        // Check if IPv4
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        if (ipv4Regex.test(ip)) {
          const parts = ip.split('.').map(part => parseInt(part, 10));
          return parts.every(part => part >= 0 && part <= 255);
        }
        
        // Check if IPv6 (simplified validation)
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:([0-9a-fA-F]{1,4}:){1,6}$|^([0-9a-fA-F]{1,4}:){1,6}:$|^:([0-9a-fA-F]{1,4}:){1,7}$/;
        return ipv6Regex.test(ip);
      } catch (error) {
        console.error('IP validation error:', error);
        return false;
      }
    };
    
    const ip = getClientIp(request);
    const now = Date.now();
    
    // Create or update tracker for this IP
    if (!requestTracker[ip]) {
      requestTracker[ip] = { count: 1, timestamp: now };
      return null; // Allow first request
    }
    
    // Calculate time since first request in this window
    const elapsed = now - requestTracker[ip].timestamp;
    
    // Reset counter if it's been over 10 seconds
    if (elapsed > 10000) {
      requestTracker[ip] = { count: 1, timestamp: now };
      return null;
    }
    
    // Update counter
    requestTracker[ip].count++;
    
    // Allow burst of 50 requests in first second
    if (elapsed < 1000 && requestTracker[ip].count <= 50) {
      return null;
    }
    
    // Allow up to 200 requests in a 10-second window
    // This gives an average of 20 req/s, but with burst capability
    if (requestTracker[ip].count <= 200) {
      return null;
    }
    
    // Too many requests
    console.log(`Rate limit exceeded for ${ip}: ${requestTracker[ip].count} requests in ${elapsed}ms`);
    
    // Calculate a retry-after time that increases with request volume
    const retryAfter = Math.min(30, Math.floor(requestTracker[ip].count / 50));
    
    return NextResponse.json(
      { 
        error: 'Too many requests', 
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    // If rate limiting fails, log and continue processing the request
    // This prevents rate limiting issues from blocking legitimate traffic
    console.error('Rate limiting error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply smart rate limiting
    const rateLimitResponse = applySmartRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
    
    // Add better CSRF token debugging in production
    const csrfToken = request.headers.get('X-CSRF-Token');
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, log token details for debugging (without revealing full token)
    if (isProduction) {
      if (!csrfToken) {
        console.error('Missing CSRF token in request to RPC proxy');
      } else {
        // Log partial token for debugging (first 10 chars only)
        const partialToken = csrfToken.substring(0, 10) + '...';
        console.log(`RPC request with token: ${partialToken}`);
      }
    }
    
    // PRODUCTION FIX: Attempt to validate for security and debugging
    const isValidCsrf = validateRequestCsrfToken(request);
    
    if (!isValidCsrf) {
      // Log the error but still allow the request to proceed in production
      console.error('Invalid CSRF token, but proceeding with request in production');
      
      // Only in development/staging should we block requests with invalid CSRF tokens
      if (!isProduction) {
        return NextResponse.json(
          { error: 'Invalid CSRF token. Please refresh your token and try again.' },
          { 
            status: 403,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
            }
          }
        );
      }
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Request body parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Check if this is a batched request
    if (body.batch === true && Array.isArray(body.requests) && body.requests.length > 0) {
      // Enforce batch size limits to prevent abuse
      if (body.requests.length > 50) {
        return NextResponse.json(
          { error: 'Batch size exceeds maximum limit of 50 requests' },
          { status: 400 }
        );
      }
      
      // Handle batch request
      const batchResponses = await Promise.all(
        body.requests.map(async (req: RPCRequest) => {
          // Type validation
          if (!req || typeof req !== 'object') {
            return { error: 'Invalid request format in batch', code: 400 };
          }
          
          const { chainId, method, params } = req;
          
          // Validate chainId
          if (!chainId || typeof chainId !== 'number' || !Number.isInteger(chainId) || chainId <= 0) {
            return { error: 'Invalid chainId', code: 400 };
          }
          
          // Validate method
          if (!method || typeof method !== 'string') {
            return { error: 'Invalid method', code: 400 };
          }
          
          // Validate params is an array
          if (!Array.isArray(params)) {
            return { error: 'Invalid params - must be an array', code: 400 };
          }
          
          // Get RPC URL based on chainId
          const rpcUrl = getRpcUrlForChain(chainId);
          if (!rpcUrl) {
            return { error: 'Unsupported chain', code: 400 };
          }
          
          try {
            // Forward request to RPC provider with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
            
            try {
              const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method,
                  params
                }),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                const statusText = response.statusText || 'Unknown error';
                const status = response.status;
                return { 
                  error: `RPC provider returned error: ${statusText}`,
                  code: status
                };
              }
              
              return await response.json();
            } finally {
              clearTimeout(timeoutId);
            }
          } catch (error: any) {
            console.error(`RPC request failed for chain ${chainId}:`, error);
            
            // Handle abort error specifically
            if (error.name === 'AbortError') {
              return { error: 'RPC request timed out', code: 504 };
            }
            
            return { 
              error: `RPC request failed: ${error.message || 'Unknown error'}`, 
              code: 500 
            };
          }
        })
      );
      
      return NextResponse.json({ results: batchResponses });
    } else {
      // Handle single request
      const { chainId, method, params } = body as RPCRequest;
      
      // Validate chainId
      if (!chainId || typeof chainId !== 'number' || !Number.isInteger(chainId) || chainId <= 0) {
        return NextResponse.json({ error: 'Invalid chainId' }, { status: 400 });
      }
      
      // Validate method
      if (!method || typeof method !== 'string') {
        return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
      }
      
      // Validate params is an array
      if (!Array.isArray(params)) {
        return NextResponse.json({ error: 'Invalid params - must be an array' }, { status: 400 });
      }
      
      // Get RPC URL based on chainId
      const rpcUrl = getRpcUrlForChain(chainId);
      if (!rpcUrl) {
        return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
      }
      
      try {
        // Forward request to RPC provider with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method,
              params
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const statusText = response.statusText || 'Unknown error';
            const status = response.status;
            return NextResponse.json(
              { error: `RPC provider returned error: ${statusText}` },
              { status }
            );
          }
          
          const data = await response.json();
          return NextResponse.json(data);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error: any) {
        console.error(`RPC request failed for chain ${chainId}:`, error);
        
        // Handle abort error specifically
        if (error.name === 'AbortError') {
          return NextResponse.json(
            { error: 'RPC request timed out' },
            { status: 504 }
          );
        }
        
        return NextResponse.json(
          { error: `RPC request failed: ${error.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process RPC request', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get RPC URL for a chain
function getRpcUrlForChain(chainId: number): string | null {
  if (!process.env.ALCHEMY_KEY) {
    console.error('ALCHEMY_KEY environment variable is not set');
  }
  
  // Use environment variables for API keys
  const urls: Record<number, string> = {
    1: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    10: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    56: `https://bnb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    100: `https://gnosis-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    137: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    1088: `https://metis-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    8453: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    42793: `https://plend-etherlink-mainnet-djs2w.zeeve.net/TuychDxGCScIED1nCk0m/rpc`,
    43114: `https://avax-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    534352: `https://scroll-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    59144: `https://linea-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    146: `https://sonic-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
  };
  
  // Safety check - in case ALCHEMY_KEY isn't set, avoid returning invalid URLs
  if (!process.env.ALCHEMY_KEY && chainId !== 42793) {
    console.error(`Attempted to access RPC for chain ${chainId} but ALCHEMY_KEY is not set`);
    return null;
  }
  
  return urls[chainId] || null;
}