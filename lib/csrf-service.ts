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
  return localStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * Store a CSRF token in local storage
 * @param token The token to store
 */
export function storeCsrfToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CSRF_TOKEN_KEY, token);
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
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    
    if (data.success && data.token) {
      storeCsrfToken(data.token);
      return data.token;
    }
    
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