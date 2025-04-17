/**
 * Service for handling Discord-related functionality
 */

interface SubmitDiscordIdParams {
  discordId: string;
  walletAddress?: string;
  portfolioValue: number;
}

interface SubmitDiscordIdResponse {
  success: boolean;
  message: string;
}

/**
 * Checks if a user has already submitted their Discord ID
 * @param walletAddress The wallet address to check
 * @returns Promise<boolean> True if the user has already submitted their Discord ID
 */
export async function checkDiscordIdSubmitted(walletAddress: string): Promise<boolean> {
  if (!walletAddress) return false;
  
  try {
    // Use Next.js API route to check if Discord ID exists
    const response = await fetch(`/api/discord-check?wallet=${walletAddress}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error('Error checking Discord ID:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking Discord ID submission:', error);
    return false; // Default to false on error
  }
}

/**
 * Submit a user's Discord ID to the backend
 * @param params Object containing Discord ID and additional user context
 * @returns Promise resolving to the API response
 */
export async function submitDiscordId({
  discordId,
  walletAddress,
  portfolioValue,
}: SubmitDiscordIdParams): Promise<SubmitDiscordIdResponse> {
  try {
    // Use Next.js API route to submit the Discord ID
    const response = await fetch('/api/discord-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId, walletAddress, portfolioValue }),
    });
    
    // If the API call fails, throw an error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with status: ${response.status}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'Successfully connected Discord ID',
    };
  } catch (error) {
    console.error('Error submitting Discord ID:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Validate a Discord ID format
 * Handles both old format (username#1234) and new format (username)
 * 
 * @param discordId The Discord ID to validate
 * @returns String containing error message if invalid, empty string if valid
 */
export function validateDiscordId(discordId: string): string {
  const trimmedId = discordId.trim();
  
  if (!trimmedId) {
    return 'Discord ID is required';
  }
  
  // Check length requirements (minimum 2 characters)
  if (trimmedId.length < 2) {
    return 'Discord ID must be at least 2 characters';
  }
  
  // Check for maximum length (Discord usernames can't exceed 32 characters)
  if (trimmedId.length > 37) { // 32 + # + 4 digits
    return 'Discord ID is too long (maximum 32 characters)';
  }
  
  // Check for classic Discord format (username#discriminator)
  if (trimmedId.includes('#')) {
    // Split into username and discriminator
    const [username, discriminator] = trimmedId.split('#');
    
    // Validate username part
    if (username.length < 2 || username.length > 32) {
      return 'Discord username must be between 2 and 32 characters';
    }
    
    // Validate discriminator (should be 4 digits)
    if (!/^\d{4}$/.test(discriminator)) {
      return 'Discord discriminator must be 4 digits';
    }
    
    // Check for valid characters in username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Discord username can only contain letters, numbers, and underscores';
    }
  } 
  // New Discord format without discriminator (just username)
  else {
    // Validate that username contains only valid characters
    if (!/^[a-zA-Z0-9_\.]+$/.test(trimmedId)) {
      return 'Discord username can only contain letters, numbers, underscores, and periods';
    }
    
    // New Discord usernames must be at least 2 characters and at most 32
    if (trimmedId.length < 2 || trimmedId.length > 32) {
      return 'Discord username must be between 2 and 32 characters';
    }
  }
  
  return '';
} 