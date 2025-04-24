import { NextResponse } from 'next/server';
import { validateTelegramUsername } from '@/services/telegram-service';
import { supabaseServer } from '@/lib/supabase-client';
import { validateRequestCsrfToken } from '@/lib/csrf-protection';
import { applyRateLimit, getClientIp } from '@/lib/rate-limiter';

/**
 * Interface for the Telegram user in Supabase
 */
interface TelegramUser {
  id?: string;
  telegram_username: string;
  wallet_address?: string;
  portfolio_value: number;
  website: 'AGGREGATOR' | 'MARKETS';
  created_at?: string;
}

/**
 * Helper function to get a user-friendly error message
 */
function getErrorMessage(error: any): string {
  // Handle specific error codes
  if (error.code === '23505') { // Unique constraint violation
    if (error.details?.includes('wallet_address')) {
      return 'This wallet has already submitted a Telegram username';
    }
    if (error.details?.includes('telegram_username')) {
      return 'This Telegram username has already been registered';
    }
    return 'This record already exists in our database';
  }
  
  // Other database errors
  if (error.code?.startsWith('22') || error.code?.startsWith('23')) {
    return 'Invalid data format: Please check your submission';
  }
  
  // Default error message
  return error.message || 'Failed to store data in database';
}

/**
 * API route for handling Telegram username submissions (Next.js App Router format)
 */
export async function POST(request: Request) {
  try {
    // 1. Check CSRF token
    if (!validateRequestCsrfToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
    
    // 2. Apply rate limiting
    const rateLimit = await applyRateLimit(
      request, 
      undefined, // Use IP as identifier
      5,        // 5 requests per window
      60000     // 1 minute window
    );
    
    if (rateLimit) {
      return rateLimit; // Return rate limit response if limit exceeded
    }
    
    // 3. Check Referer header
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    if (
      (!referer || (!referer.includes('superlend.xyz') && !referer.includes('localhost'))) &&
      (!origin || (!origin.includes('superlend.xyz') && !origin.includes('localhost')))
    ) {
      console.log(`Suspicious request with referer: ${referer}, origin: ${origin}`);
      return NextResponse.json(
        { success: false, message: 'Unauthorized request source' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { telegramUsername, walletAddress, portfolioValue, website = 'AGGREGATOR' } = body;

    // Validate Telegram username format
    const validationError = validateTelegramUsername(telegramUsername);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    // Validate website value
    if (website !== 'AGGREGATOR' && website !== 'MARKETS') {
      return NextResponse.json(
        { success: false, message: 'Invalid website value. Must be either AGGREGATOR or MARKETS' },
        { status: 400 }
      );
    }

    // Ensure the username starts with @ before storing
    let formattedUsername = telegramUsername.trim();
    if (!formattedUsername.startsWith('@')) {
      formattedUsername = '@' + formattedUsername;
    }

    // Add to Supabase
    const { error } = await supabaseServer
      .from('telegram_users')
      .insert({
        telegram_username: formattedUsername,
        wallet_address: walletAddress || null,
        portfolio_value: portfolioValue,
        website: website,
      } as TelegramUser);

    if (error) {
      console.error('Supabase error:', error);
      const errorMessage = getErrorMessage(error);
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log('Telegram username submission saved:', {
      telegramUsername: formattedUsername,
      walletAddress,
      portfolioValue,
      website,
      timestamp: new Date().toISOString(),
      ip: getClientIp(request)
    });

    // Send success response
    return NextResponse.json({
      success: true,
      message: 'Successfully saved Telegram username'
    });
  } catch (error) {
    console.error('Error in telegram-connect API:', error);
    let message = 'Failed to save Telegram username';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      message = getErrorMessage(error);
    }
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
} 