const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// Load credentials from the JSON file (only accessible to the function, not exposed to browser)
const CREDENTIALS_PATH = path.join(__dirname, '_private/google-credentials.json');
const CREDENTIALS = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

// Get Sheet ID from environment variable (this is short enough)
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Validate a Discord ID format
 * Handles both old format (username#1234) and new format (username)
 * 
 * @param {string} discordId The Discord ID to validate
 * @returns {string} Error message if invalid, empty string if valid
 */
function validateDiscordId(discordId) {
  const trimmedId = discordId?.trim();
  
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

/**
 * Add a Discord submission to the Google Sheet
 */
async function addDiscordSubmission(data) {
  try {
    if (!SHEET_ID) {
      console.error('Missing GOOGLE_SHEET_ID environment variable');
      return false;
    }

    // Create JWT auth client
    const serviceAccountAuth = new JWT({
      email: CREDENTIALS.client_email,
      key: CREDENTIALS.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize the sheet
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];
    
    // Add the row
    await sheet.addRow({
      'Discord ID': data.discordId,
      'Wallet Address': data.walletAddress || 'Not provided',
      'Portfolio Value': data.portfolioValue,
      'Timestamp': new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error adding to Google Sheet:', error);
    return false;
  }
}

// Main handler function
exports.handler = async (event, context) => {
  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        success: false, 
        message: 'Method not allowed' 
      })
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { discordId, walletAddress, portfolioValue } = body;

    // Validate Discord ID format
    const validationError = validateDiscordId(discordId);
    if (validationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          message: validationError 
        })
      };
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
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Successfully saved Discord ID'
      })
    };
  } catch (error) {
    console.error('Error in discord-connect function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to save Discord ID' 
      })
    };
  }
}; 