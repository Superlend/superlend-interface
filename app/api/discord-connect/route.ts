import { NextResponse } from 'next/server';
import { validateDiscordId } from '@/services/discord-service';
import { supabaseServer, type DiscordUser } from '@/lib/supabase-client';

/**
 * API route for handling Discord ID submissions (Next.js App Router format)
 */
export async function POST(request: Request) {
  try {
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
      throw new Error('Failed to store data in database');
    }

    // Log for debugging
    console.log('Discord ID submission saved:', {
      discordId,
      walletAddress,
      portfolioValue,
      timestamp: new Date().toISOString()
    });

    // Send success response
    return NextResponse.json({
      success: true,
      message: 'Successfully saved Discord ID'
    });
  } catch (error) {
    console.error('Error in discord-connect API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save Discord ID' 
      },
      { status: 500 }
    );
  }
} 