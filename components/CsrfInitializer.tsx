'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/csrf-service';

/**
 * Component that initializes CSRF protection on page load
 * This ensures a CSRF token is available for API calls
 */
export function CsrfInitializer() {
  useEffect(() => {
    // Initialize CSRF token on first page load
    const initCsrf = async () => {
      try {
        await fetchCsrfToken();
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    };
    
    initCsrf();
  }, []);
  
  // This component doesn't render anything
  return null;
} 