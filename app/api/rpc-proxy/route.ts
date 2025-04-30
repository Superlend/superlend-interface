// app/api/rpc-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequestCsrfToken } from '@/lib/csrf-protection';

// In-memory request tracking for smarter rate limiting
const requestTracker: Record<string, { count: number, timestamp: number }> = {};

// Clean up stale request tracking periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const key in requestTracker) {
      if (now - requestTracker[key].timestamp > 60000) { // 1 minute
        delete requestTracker[key];
      }
    }
  }, 60000); // Clean up every minute
}

// Advanced rate limiting that allows bursts but prevents sustained high rates
function applySmartRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
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
      }
    }
  );
}

export async function POST(request: NextRequest) {
  // Apply smart rate limiting
  const rateLimitResponse = applySmartRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  // Re-enable CSRF validation with clear error message
  if (!validateRequestCsrfToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token. Please refresh your token and try again.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    
    // Check if this is a batched request
    if (body.batch && Array.isArray(body.requests)) {
      // Handle batch request
      const batchResponses = await Promise.all(
        body.requests.map(async (req: any) => {
          const { chainId, method, params } = req;
          
          // Validate chainId
          if (!chainId || typeof chainId !== 'number') {
            return { error: 'Invalid chainId', code: 400 };
          }
          
          // Get RPC URL based on chainId
          const rpcUrl = getRpcUrlForChain(chainId);
          if (!rpcUrl) {
            return { error: 'Unsupported chain', code: 400 };
          }
          
          try {
            // Forward request to RPC provider
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params
              })
            });
            
            return await response.json();
          } catch (error) {
            return { error: 'RPC request failed', code: 500 };
          }
        })
      );
      
      return NextResponse.json({ results: batchResponses });
    } else {
      // Handle single request
      const { chainId, method, params } = body;
      
      // Validate chainId
      if (!chainId || typeof chainId !== 'number') {
        return NextResponse.json({ error: 'Invalid chainId' }, { status: 400 });
      }
      
      // Get RPC URL based on chainId
      const rpcUrl = getRpcUrlForChain(chainId);
      if (!rpcUrl) {
        return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 });
      }
      
      // Forward request to RPC provider
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        })
      });
      
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process RPC request' },
      { status: 500 }
    );
  }
}

// Helper function to get RPC URL for a chain
function getRpcUrlForChain(chainId: number): string | null {
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
  
  return urls[chainId] || null;
}