/**
 * Test script for verifying Google Sheets integration
 * 
 * Run with: npx ts-node scripts/test-google-sheets.ts
 */

import { addDiscordSubmission } from '../lib/google-sheets';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testGoogleSheets() {
  console.log('Testing Google Sheets integration...');
  
  if (!process.env.GOOGLE_SHEET_ID) {
    console.error('Missing GOOGLE_SHEET_ID environment variable');
    process.exit(1);
  }
  
  // Check if GOOGLE_SHEET_ID contains the full URL and extract just the ID
  const sheetId = process.env.GOOGLE_SHEET_ID.includes('docs.google.com') 
    ? process.env.GOOGLE_SHEET_ID.match(/\/d\/(.*?)\//)![1]
    : process.env.GOOGLE_SHEET_ID;
  
  console.log(`Using Google Sheet ID: ${sheetId}`);
  
  if (!process.env.GOOGLE_CREDENTIALS) {
    console.error('Missing GOOGLE_CREDENTIALS environment variable');
    process.exit(1);
  }
  
  try {
    console.log('Attempting to add test submission...');
    
    const result = await addDiscordSubmission({
      discordId: 'test-user#1234',
      walletAddress: '0xTestWalletAddress',
      portfolioValue: 1500,
    });
    
    if (result) {
      console.log('✅ Successfully added test submission to Google Sheet!');
    } else {
      console.error('❌ Failed to add test submission to Google Sheet');
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
  }
}

// Run the test
testGoogleSheets(); 