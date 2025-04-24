import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf-protection';

/**
 * Endpoint to get a CSRF token for form submissions
 */
export async function GET(request: Request) {
  // Origin will be checked by the middleware
  
  // Generate a new CSRF token
  const token = generateCsrfToken();
  
  // Return the token
  return NextResponse.json({
    success: true,
    token,
  });
} 