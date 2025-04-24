import { useState, useEffect } from 'react';
import { isPortfolioAboveThreshold } from '@/lib/portfolio-utils';
import { checkTelegramUsernameSubmitted } from '@/services/telegram-service';

const TELEGRAM_DIALOG_SHOWN_KEY = 'superlend_telegram_dialog_shown';

interface UseTelegramDialogProps {
  portfolioValue: number;
  lendTxCompleted: boolean;
  walletAddress?: string;
}

interface UseTelegramDialogReturn {
  showTelegramDialog: boolean;
  setShowTelegramDialog: (show: boolean) => void;
  shouldPromptForTelegram: boolean;
  hasSeenDialog: boolean;
  resetDialogShownState: () => void;
}

/**
 * Custom hook to manage the Telegram dialog state
 * 
 * @param portfolioValue The user's current portfolio value
 * @param lendTxCompleted Whether a lend transaction has just completed successfully
 * @param walletAddress The user's connected wallet address
 * @returns Object containing dialog state and management functions
 */
export function useTelegramDialog({
  portfolioValue,
  lendTxCompleted,
  walletAddress
}: UseTelegramDialogProps): UseTelegramDialogReturn {
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [hasSeenDialog, setHasSeenDialog] = useState(false);
  const [hasSubmittedTelegram, setHasSubmittedTelegram] = useState(false);
  
  // Check if user has already submitted Telegram username when wallet address changes
  useEffect(() => {
    if (!walletAddress) return;
    
    const checkPreviousSubmission = async () => {
      try {
        const hasSubmitted = await checkTelegramUsernameSubmitted(walletAddress);
        setHasSubmittedTelegram(hasSubmitted);
      } catch (error) {
        console.error("Error checking Telegram submission status:", error);
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
      !hasSubmittedTelegram &&
      walletAddress
    ) {
      setShowTelegramDialog(true);
    }
  }, [lendTxCompleted, portfolioValue, hasSeenDialog, hasSubmittedTelegram, walletAddress]);
  
  // For testing - allows resetting the "seen" state
  const resetDialogShownState = () => {
    localStorage.removeItem(TELEGRAM_DIALOG_SHOWN_KEY);
    setHasSeenDialog(false);
  };
  
  return {
    showTelegramDialog,
    setShowTelegramDialog,
    shouldPromptForTelegram: isPortfolioAboveThreshold(portfolioValue) && !hasSeenDialog && !hasSubmittedTelegram,
    hasSeenDialog,
    resetDialogShownState,
  };
} 