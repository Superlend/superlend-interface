import { useState, useEffect, useRef } from 'react';
import { isPortfolioAboveThreshold } from '@/lib/portfolio-utils';
const WHALES_SUPPORT_INTERACTION_KEY = 'superlend_whales_support_interacted';

interface UseWhalesSupportDialogProps {
  portfolioValue: number;
  lendTxCompleted: boolean;
  walletAddress?: string;
}

interface UseWhalesSupportDialogReturn {
  showWhalesSupportDialog: boolean;
  setShowWhalesSupportDialog: (show: boolean) => void;
  shouldPromptForWhalesSupport: boolean;
  hasInteracted: boolean;
}

/**
 * Custom hook to manage the Whales Support dialog state
 * 
 * @param portfolioValue The user's current portfolio value
 * @param lendTxCompleted Whether a lend transaction has just completed successfully
 * @param walletAddress The user's connected wallet address
 * @returns Object containing dialog state and management functions
 */
export function useWhalesSupportDialog({
  portfolioValue,
  lendTxCompleted,
  walletAddress
}: UseWhalesSupportDialogProps): UseWhalesSupportDialogReturn {
  const [showWhalesSupportDialog, setShowWhalesSupportDialog] = useState(false);

  const hasInteracted = typeof window !== 'undefined'
    ? localStorage.getItem(WHALES_SUPPORT_INTERACTION_KEY) === 'true'
    : false;

  const wasDialogShownRef = useRef(false);

  // Update interaction state when dialog transitions from open to closed
  useEffect(() => {
    if (showWhalesSupportDialog) {
      wasDialogShownRef.current = true;
    } else if (wasDialogShownRef.current && !showWhalesSupportDialog) {
      // Only mark as interacted if dialog was previously shown and is now closed
      localStorage.setItem(WHALES_SUPPORT_INTERACTION_KEY, 'true');
    }
  }, [showWhalesSupportDialog]);

  // Determine if we should show the dialog based on transaction state and portfolio value
  useEffect(() => {
    if (
      lendTxCompleted &&
      isPortfolioAboveThreshold(portfolioValue) &&
      !hasInteracted &&
      !!walletAddress
    ) {
      setShowWhalesSupportDialog(true);
    }
  }, [lendTxCompleted, portfolioValue, hasInteracted, walletAddress]);

  return {
    showWhalesSupportDialog,
    setShowWhalesSupportDialog,
    shouldPromptForWhalesSupport: isPortfolioAboveThreshold(portfolioValue) && !hasInteracted,
    hasInteracted,
  };
} 