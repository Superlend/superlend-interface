import { useState, useEffect } from 'react';
import { isPortfolioAboveThreshold } from '@/lib/portfolio-utils';

const DISCORD_DIALOG_SHOWN_KEY = 'superlend_discord_dialog_shown';

interface UseDiscordDialogProps {
  portfolioValue: number;
  lendTxCompleted: boolean;
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
 * @returns Object containing dialog state and management functions
 */
export function useDiscordDialog({
  portfolioValue,
  lendTxCompleted
}: UseDiscordDialogProps): UseDiscordDialogReturn {
  const [showDiscordDialog, setShowDiscordDialog] = useState(false);
  const [hasSeenDialog, setHasSeenDialog] = useState(false);
  
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
  
  // Determine if we should show the dialog based on transaction state and portfolio value
  useEffect(() => {
    if (
      lendTxCompleted && 
      isPortfolioAboveThreshold(portfolioValue) && 
      !hasSeenDialog
    ) {
      // Add a slight delay to show the dialog after transaction completes
      const timer = setTimeout(() => {
        setShowDiscordDialog(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lendTxCompleted, portfolioValue, hasSeenDialog]);
  
  // For testing - allows resetting the "seen" state
  const resetDialogShownState = () => {
    localStorage.removeItem(DISCORD_DIALOG_SHOWN_KEY);
    setHasSeenDialog(false);
  };
  
  return {
    showDiscordDialog,
    setShowDiscordDialog,
    shouldPromptForDiscord: isPortfolioAboveThreshold(portfolioValue) && !hasSeenDialog,
    hasSeenDialog,
    resetDialogShownState,
  };
} 