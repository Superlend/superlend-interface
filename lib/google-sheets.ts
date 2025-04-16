import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// This should be the ID from your Google Sheet URL
// Example: https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
const SHEET_ID_RAW = process.env.GOOGLE_SHEET_ID || '';

// Extract the ID from the URL if needed
const SHEET_ID = SHEET_ID_RAW.includes('docs.google.com')
  ? SHEET_ID_RAW.match(/\/d\/(.*?)(\/|$)/)![1]
  : SHEET_ID_RAW;

// Parse the credentials JSON string from environment variable
const CREDENTIALS = process.env.GOOGLE_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
  : null;

export interface DiscordSubmission {
  discordId: string;
  walletAddress?: string;
  portfolioValue: number;
}

/**
 * Add a new Discord ID submission to the Google Sheet
 */
export async function addDiscordSubmission(data: DiscordSubmission): Promise<boolean> {
  try {
    if (!SHEET_ID || !CREDENTIALS) {
      console.error('Google Sheets credentials missing');
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