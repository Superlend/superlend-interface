import { NextResponse } from 'next/server';
import { addDiscordSubmission } from '@/lib/google-sheets';
import { validateDiscordId } from '@/services/discord-service';

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

    // Add to Google Sheet
    const added = await addDiscordSubmission({
      discordId,
      walletAddress,
      portfolioValue
    });

    if (!added) {
      throw new Error('Failed to add to Google Sheet');
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