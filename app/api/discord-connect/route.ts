import { NextResponse } from 'next/server';
import { validateDiscordId } from '@/services/discord-service';
import { supabaseServer, type DiscordUser } from '@/lib/supabase-client';
import { applyRateLimit, getClientIp } from '@/lib/rate-limiter';

/**
 * Helper function to get a user-friendly error message
 */
function getErrorMessage(error: any): string {
  // Handle specific error codes
  if (error.code === '23505') { // Unique constraint violation
    if (error.details?.includes('wallet_address')) {
      return 'This wallet has already submitted a Discord ID';
    }
    if (error.details?.includes('discord_id')) {
      return 'This Discord ID has already been registered';
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
 * API route for handling Discord ID submissions (Next.js App Router format)
 */
export async function POST(request: Request) {
  try {
    // 1. Apply rate limiting
    const rateLimit = await applyRateLimit(
      request, 
      undefined, // Use IP as identifier
      5,        // 5 requests per window
      60000     // 1 minute window
    );
    
    if (rateLimit) {
      return rateLimit; // Return rate limit response if limit exceeded
    }
    
    // 2. Check Referer header
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
    const { discordId, walletAddress, portfolioValue } = body;

    // Validate Discord ID format
    const validationError = validateDiscordId(discordId);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    // Add to Supabase
    const { error } = await supabaseServer
      .from('discord_users')
      .insert({
        discord_id: discordId,
        wallet_address: walletAddress || null,
        portfolio_value: portfolioValue,
      } as DiscordUser);

    if (error) {
      console.error('Supabase error:', error);
      const errorMessage = getErrorMessage(error);
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log('Discord ID submission saved:', {
      discordId,
      walletAddress,
      portfolioValue,
      timestamp: new Date().toISOString(),
      ip: getClientIp(request)
    });

    // Send success response
    return NextResponse.json({
      success: true,
      message: 'Successfully saved Discord ID'
    });
  } catch (error) {
    console.error('Error in discord-connect API:', error);
    let message = 'Failed to save Discord ID';
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