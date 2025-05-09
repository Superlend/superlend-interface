/**
 * Client-side service for managing CSRF tokens
 */

// Storage key for CSRF token
const CSRF_TOKEN_KEY = 'csrf_token';

/**
 * Get the current CSRF token from storage
 * @returns The stored token or null if none exists
 */
export function getStoredCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first
    let token = localStorage.getItem(CSRF_TOKEN_KEY);
    
    // If not in localStorage, try sessionStorage as fallback
    if (!token) {
      token = sessionStorage.getItem(CSRF_TOKEN_KEY);
      
      // If found in sessionStorage but not localStorage, restore to localStorage
      if (token) {
        localStorage.setItem(CSRF_TOKEN_KEY, token);
      }
    }
    
    return token;
  } catch (error) {
    console.error('Failed to retrieve CSRF token:', error);
    return null;
  }
}

/**
 * Store a CSRF token in local storage
 * @param token The token to store
 */
export function storeCsrfToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Store in localStorage
    localStorage.setItem(CSRF_TOKEN_KEY, token);
    
    // Also store in sessionStorage as a fallback
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    
    // For debugging in production
    const isProduction = window.location.hostname !== 'localhost';
    if (isProduction) {
      console.log(`CSRF token stored (${token.substring(0, 10)}...)`);
    }
  } catch (error) {
    console.error('Failed to store CSRF token:', error);
  }
}

/**
 * Clear the stored CSRF token
 */
export function clearCsrfToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Fetch a new CSRF token from the server
 * @returns Promise resolving to the new token
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    const startTime = Date.now();
    
    const response = await fetch('/api/csrf-token', {
      // Add cache control headers to avoid cached responses
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    if (isProduction && responseTime > 1000) {
      console.warn(`CSRF token fetch took ${responseTime}ms`);
    }
    
    const data = await response.json();
    
    if (data.success && data.token) {
      storeCsrfToken(data.token);
      return data.token;
    }
    
    console.error('CSRF token response missing success or token:', data);
    return null;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Get a valid CSRF token, fetching a new one if needed
 * @returns Promise resolving to a valid token or null if unavailable
 */
export async function ensureCsrfToken(): Promise<string | null> {
  // Check for existing token
  const existingToken = getStoredCsrfToken();
  if (existingToken) return existingToken;
  
  // Fetch new token if none exists
  return fetchCsrfToken();
}

/**
 * Add CSRF token to fetch headers
 * @param headers Existing headers object
 * @returns Promise resolving to headers with CSRF token added
 */
export async function addCsrfToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await ensureCsrfToken();
  const headersObj = headers instanceof Headers ? 
    Object.fromEntries(headers.entries()) : 
    {...headers};
  
  if (token) {
    return {
      ...headersObj,
      'X-CSRF-Token': token
    };
  }
  
  return headersObj;
} 