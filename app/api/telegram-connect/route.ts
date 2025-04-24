import { NextResponse } from 'next/server';
import { validateTelegramUsername } from '@/services/telegram-service';
import { supabaseServer } from '@/lib/supabase-client';

/**
 * Interface for the Telegram user in Supabase
 */
interface TelegramUser {
  id?: string;
  telegram_username: string;
  wallet_address?: string;
  portfolio_value: number;
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
    // Parse the request body
    const body = await request.json();
    const { telegramUsername, walletAddress, portfolioValue } = body;

    // Validate Telegram username format
    const validationError = validateTelegramUsername(telegramUsername);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    // Format username (remove @ if present)
    const formattedUsername = telegramUsername.startsWith('@') 
      ? telegramUsername.substring(1) 
      : telegramUsername;

    // Add to Supabase
    const { error } = await supabaseServer
      .from('telegram_users')
      .insert({
        telegram_username: formattedUsername,
        wallet_address: walletAddress || null,
        portfolio_value: portfolioValue,
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
      timestamp: new Date().toISOString()
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