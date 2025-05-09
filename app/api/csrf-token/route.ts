import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf-protection';

/**
 * Endpoint to get a CSRF token for form submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Origin will be checked by the middleware
    
    // Generate a new CSRF token
    const token = generateCsrfToken();
    
    // Return the token with appropriate headers to prevent caching
    return NextResponse.json(
      {
        success: true,
        token,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 