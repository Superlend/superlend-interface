'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/typography'
import { Input } from '../ui/input'
import { useTelegramDialog } from '@/hooks/useTelegramDialog'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import TelegramConnectionDialog from '../dialogs/TelegramConnectionDialog'

/**
 * Debug component for testing Telegram dialog functionality
 * Only visible in development mode
 */
export function DebugPortfolioTools() {
  const [portfolioValue, setPortfolioValue] = useState(1500)
  const [showDialog, setShowDialog] = useState(false)
  const { walletAddress } = useWalletConnection()

  // Setup Telegram dialog hook
  const { 
    showTelegramDialog,
    setShowTelegramDialog,
    resetDialogShownState
  } = useTelegramDialog({
    portfolioValue,
    lendTxCompleted: showDialog,
    walletAddress
  })

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-100 border border-gray-300 rounded-md shadow-md z-50 w-80">
      <h3 className="font-medium text-gray-800 mb-2">Telegram Dialog Debug</h3>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="portfolio-value">Test Portfolio Value ($)</Label>
          <Input 
            id="portfolio-value"
            type="number"
            value={portfolioValue}
            onChange={(e) => setPortfolioValue(Number(e.target.value))}
            className="mt-1"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => setShowDialog(true)}
            variant="outline"
            size="sm"
          >
            Simulate Successful Lend
          </Button>
          
          <Button 
            onClick={resetDialogShownState}
            variant="outline" 
            size="sm"
          >
            Reset &quot;Seen Dialog&quot; State
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Current state: {showTelegramDialog ? 'Dialog showing' : 'Dialog hidden'}
        </div>
      </div>

      {/* The Telegram dialog component */}
      <TelegramConnectionDialog
        open={showTelegramDialog}
        setOpen={setShowTelegramDialog}
        portfolioValue={portfolioValue}
        website="AGGREGATOR"
      />
    </div>
  )
} 