/**
 * Service for handling Telegram-related functionality
 */

interface SubmitTelegramUsernameParams {
  telegramUsername: string;
  walletAddress?: string;
  portfolioValue: number;
}

interface SubmitTelegramUsernameResponse {
  success: boolean;
  message: string;
}

/**
 * Checks if a user has already submitted their Telegram username
 * @param walletAddress The wallet address to check
 * @returns Promise<boolean> True if the user has already submitted their Telegram username
 */
export async function checkTelegramUsernameSubmitted(walletAddress: string): Promise<boolean> {
  if (!walletAddress) return false;
  
  try {
    // Use Next.js API route to check if Telegram username exists
    const response = await fetch(`/api/telegram-check?wallet=${walletAddress}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error('Error checking Telegram username:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking Telegram username submission:', error);
    return false; // Default to false on error
  }
}

/**
 * Submit a user's Telegram username to the backend
 * @param params Object containing Telegram username and additional user context
 * @returns Promise resolving to the API response
 */
export async function submitTelegramUsername({
  telegramUsername,
  walletAddress,
  portfolioValue,
}: SubmitTelegramUsernameParams): Promise<SubmitTelegramUsernameResponse> {
  try {
    // Use Next.js API route to submit the Telegram username
    const response = await fetch('/api/telegram-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramUsername, walletAddress, portfolioValue }),
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
      message: data.message || 'Successfully connected Telegram username',
    };
  } catch (error) {
    console.error('Error submitting Telegram username:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Validate a Telegram username format
 * 
 * @param telegramUsername The Telegram username to validate
 * @returns String containing error message if invalid, empty string if valid
 */
export function validateTelegramUsername(telegramUsername: string): string {
  const trimmedUsername = telegramUsername.trim();
  
  if (!trimmedUsername) {
    return 'Telegram username is required';
  }
  
  // Remove @ symbol if present
  const usernameWithoutAt = trimmedUsername.startsWith('@') 
    ? trimmedUsername.substring(1) 
    : trimmedUsername;
  
  // Check length requirements (5-32 characters)
  if (usernameWithoutAt.length < 5) {
    return 'Telegram username must be at least 5 characters';
  }
  
  if (usernameWithoutAt.length > 32) {
    return 'Telegram username cannot exceed 32 characters';
  }
  
  // Check for valid characters (letters, numbers, and underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(usernameWithoutAt)) {
    return 'Telegram username can only contain letters, numbers, and underscores';
  }
  
  return '';
} 