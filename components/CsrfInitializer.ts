'use client';

import { useEffect, useState } from 'react';
import { fetchCsrfToken, getStoredCsrfToken, clearCsrfToken } from '@/lib/csrf-service';
import { usePathname } from 'next/navigation';

/**
 * Component that initializes CSRF protection on page load
 * This ensures a CSRF token is available for API calls
 */
export function CsrfInitializer() {
  const pathname = usePathname();
  const [tokenInitialized, setTokenInitialized] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  // Initialize token on first load and on navigation
  useEffect(() => {
    const initCsrf = async () => {
      try {
        // Force a new token on each major navigation
        const now = Date.now();
        
        // Get current token
        const currentToken = getStoredCsrfToken();
        
        // Always fetch a new token in these cases:
        // 1. No existing token
        // 2. In production
        // 3. Haven't refreshed in the last 5 seconds (prevent excessive refreshes)
        if (!currentToken || (isProduction && now - lastRefreshTime > 5000)) {
          console.log('Fetching new CSRF token for path:', pathname);
          
          // Clear existing token first to ensure clean state
          clearCsrfToken();
          
          // Fetch new token
          await fetchCsrfToken();
          setLastRefreshTime(now);
        }
        
        setTokenInitialized(true);
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
        // Even on error, mark as initialized to avoid infinite retries
        setTokenInitialized(true);
      }
    };
    
    initCsrf();
  }, [pathname]);
  
  // Set up a periodic refresh for the token 
  useEffect(() => {
    if (!tokenInitialized) return;
    
    // Refresh token every 10 minutes in production, 30 minutes in dev
    const refreshInterval = setInterval(async () => {
      try {
        await fetchCsrfToken();
        console.log('CSRF token refreshed on schedule');
        setLastRefreshTime(Date.now());
      } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
      }
    }, isProduction ? 10 * 60 * 1000 : 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [tokenInitialized, isProduction]);
  
  // This component doesn't render anything
  return null;
}
