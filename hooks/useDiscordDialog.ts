import { useState, useEffect } from 'react';
import { isPortfolioAboveThreshold } from '@/lib/portfolio-utils';
import { checkDiscordIdSubmitted } from '@/services/discord-service';

const DISCORD_DIALOG_SHOWN_KEY = 'superlend_discord_dialog_shown';

interface UseDiscordDialogProps {
  portfolioValue: number;
  lendTxCompleted: boolean;
  walletAddress?: string; // Add wallet address as a prop
}

interface UseDiscordDialogReturn {
  showDiscordDialog: boolean;
  setShowDiscordDialog: (show: boolean) => void;
  shouldPromptForDiscord: boolean;
  hasSeenDialog: boolean;
  resetDialogShownState: () => void;
}

/**
 * Custom hook to manage the Discord dialog state
 * 
 * @param portfolioValue The user's current portfolio value
 * @param lendTxCompleted Whether a lend transaction has just completed successfully
 * @param walletAddress The user's connected wallet address
 * @returns Object containing dialog state and management functions
 */
export function useDiscordDialog({
  portfolioValue,
  lendTxCompleted,
  walletAddress
}: UseDiscordDialogProps): UseDiscordDialogReturn {
  const [showDiscordDialog, setShowDiscordDialog] = useState(false);
  const [hasSeenDialog, setHasSeenDialog] = useState(false);
  const [hasSubmittedDiscord, setHasSubmittedDiscord] = useState(false);
  
  // Check local storage on mount to see if user has seen the dialog before
  // useEffect(() => {
  //   const hasSeenBefore = localStorage.getItem(DISCORD_DIALOG_SHOWN_KEY) === 'true';
  //   setHasSeenDialog(hasSeenBefore);
  // }, []);
  
  // Update local storage when dialog is shown
  // useEffect(() => {
  //   if (showDiscordDialog) {
  //     localStorage.setItem(DISCORD_DIALOG_SHOWN_KEY, 'true');
  //     setHasSeenDialog(true);
  //   }
  // }, [showDiscordDialog]);

  // Check if user has already submitted Discord ID when wallet address changes
  useEffect(() => {
    if (!walletAddress) return;
    
    const checkPreviousSubmission = async () => {
      try {
        const hasSubmitted = await checkDiscordIdSubmitted(walletAddress);
        setHasSubmittedDiscord(hasSubmitted);
      } catch (error) {
        console.error("Error checking Discord submission status:", error);
      }
    };
    
    checkPreviousSubmission();
  }, [walletAddress]);
  
  // Determine if we should show the dialog based on transaction state and portfolio value
  useEffect(() => {
    if (
      lendTxCompleted && 
      isPortfolioAboveThreshold(portfolioValue, 500) && 
      !hasSeenDialog &&
      !hasSubmittedDiscord &&
      walletAddress
    ) {
      setShowDiscordDialog(true);
    }
  }, [lendTxCompleted, portfolioValue, hasSeenDialog, hasSubmittedDiscord, walletAddress]);
  
  // For testing - allows resetting the "seen" state
  const resetDialogShownState = () => {
    localStorage.removeItem(DISCORD_DIALOG_SHOWN_KEY);
    setHasSeenDialog(false);
  };
  
  return {
    showDiscordDialog,
    setShowDiscordDialog,
    shouldPromptForDiscord: isPortfolioAboveThreshold(portfolioValue) && !hasSeenDialog && !hasSubmittedDiscord,
    hasSeenDialog,
    resetDialogShownState,
  };
} 