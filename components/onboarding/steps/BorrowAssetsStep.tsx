import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Star, Check } from 'lucide-react'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'

interface BorrowAsset {
  symbol: string
  name: string
  logo: string
  borrowRate: string
  maxLtv: string
  risk: 'Low' | 'Medium' | 'High'
  color: string
  bgColor: string
  popular: boolean
  utilization: number
  liquidity: number
  availableLiquidity: number
  tokenAddress: string
  chainId: string
  protocolIdentifier: string
  platformName: string
}

export const BorrowAssetsStep: React.FC = () => {
  const { setSelectedAsset: setOnboardingSelectedAsset, selectedAsset: contextSelectedAsset } = useOnboardingContext()
  
  // Initialize selectedAsset from context if available
  const [selectedAsset, setSelectedAsset] = useState<string | null>(() => {
    return contextSelectedAsset?.tokenSymbol || null
  })

  // Update local state when context changes (e.g., when coming back to this step)
  useEffect(() => {
    if (contextSelectedAsset?.tokenSymbol && contextSelectedAsset.positionType === 'borrow') {
      setSelectedAsset(contextSelectedAsset.tokenSymbol)
    }
  }, [contextSelectedAsset])

  // Fetch real borrow opportunities data
  const { data: opportunitiesData, isLoading } = useGetOpportunitiesData({
    type: 'borrow',
    enabled: true,
  })

  // Helper functions for risk styling (moved before useMemo)
  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'Low': return 'text-green-600'
      case 'Medium': return 'text-yellow-600'
      case 'High': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskBgColor = (risk: string): string => {
    switch (risk) {
      case 'Low': return 'bg-green-50'
      case 'Medium': return 'bg-yellow-50'
      case 'High': return 'bg-red-50'
      default: return 'bg-gray-50'
    }
  }

  // Helper function to calculate risk level dynamically for borrowing
  const calculateBorrowRiskLevel = (utilization: number, liquidity: number, platformName: string, borrowRate: number): 'Low' | 'Medium' | 'High' => {
    // Risk factors for borrowing:
    // 1. High borrow rate (>8%) = higher risk
    // 2. High utilization rate (>85%) = higher risk (harder to get liquidity)
    // 3. Low available liquidity = higher risk
    // 4. Platform risk based on track record

    const highRiskProtocols = ['morpho', 'fluid']
    const mediumRiskProtocols = ['compound', 'euler']
    const lowRiskProtocols = ['aave', 'superlend']
    
    const platformLower = platformName.toLowerCase()
    
    let riskScore = 0
    
    // Borrow rate risk (higher rates = higher cost risk)
    if (borrowRate > 8) riskScore += 2
    else if (borrowRate > 5) riskScore += 1
    
    // Utilization risk (higher utilization = less available liquidity)
    if (utilization > 0.85) riskScore += 2
    else if (utilization > 0.7) riskScore += 1
    
    // Liquidity risk (less available liquidity = harder to borrow more)
    if (liquidity < 1000000) riskScore += 2
    else if (liquidity < 10000000) riskScore += 1
    
    // Protocol risk
    if (highRiskProtocols.some(p => platformLower.includes(p))) riskScore += 2
    else if (mediumRiskProtocols.some(p => platformLower.includes(p))) riskScore += 1
    else if (lowRiskProtocols.some(p => platformLower.includes(p))) riskScore -= 1
    
    if (riskScore >= 4) return 'High'
    if (riskScore >= 2) return 'Medium'
    return 'Low'
  }

  // Process and filter the borrow opportunities data
  const borrowAssets: BorrowAsset[] = useMemo(() => {
    if (!opportunitiesData?.length) return []

    // Get unique tokens and select top borrow opportunities
    const tokenMap = new Map<string, any>()
    
    opportunitiesData.forEach(item => {
      // For borrow, we want the best rates (lowest rates)
      const existing = tokenMap.get(item.token.symbol)
      if (!existing || item.platform.apy.current < existing.platform.apy.current) {
        tokenMap.set(item.token.symbol, item)
      }
    })

    // Convert to array and get top 4 assets (lowest borrow rates)
    const topAssets = Array.from(tokenMap.values())
      .sort((a, b) => a.platform.apy.current - b.platform.apy.current)
      .slice(0, 4)

    return topAssets.map((item, index) => {
      const totalLiquidity = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const totalBorrows = Number(item.platform.borrows) * Number(item.token.price_usd)
      const availableLiquidity = totalLiquidity - totalBorrows
      const utilization = item.platform.utilization_rate || 0
      const platformName = item.platform.platform_name?.split('-')[0] || ''
      const borrowRate = item.platform.apy.current
      
      const risk = calculateBorrowRiskLevel(utilization, totalLiquidity, platformName, borrowRate)
      
      // Popular borrow assets (stablecoins are popular for borrowing)
      const popularTokens = ['USDC', 'USDT', 'DAI', 'FRAX']
      const isPopular = popularTokens.includes(item.token.symbol.toUpperCase())

      return {
        symbol: item.token.symbol,
        name: item.token.name,
        logo: item.token.logo,
        borrowRate: `${borrowRate.toFixed(2)}%`,
        maxLtv: `${((item.platform.max_ltv || 0.75) * 100).toFixed(0)}%`,
        risk,
        color: getRiskColor(risk),
        bgColor: getRiskBgColor(risk),
        popular: isPopular,
        utilization,
        liquidity: totalLiquidity,
        availableLiquidity,
        // Store full opportunity data for onboarding context
        tokenAddress: item.token.address,
        chainId: item.chain_id,
        protocolIdentifier: item.platform.protocol_identifier,
        platformName: item.platform.platform_name
      }
    })
  }, [opportunitiesData])

  const handleAssetSelect = (asset: BorrowAsset) => {
    console.log('💰 Borrow asset selected:', asset.symbol)
    console.log('📦 Full asset data:', asset)
    setSelectedAsset(asset.symbol)
    
    // Store in onboarding context for final step
    const assetToStore = {
      tokenAddress: asset.tokenAddress,
      tokenSymbol: asset.symbol,
      chainId: asset.chainId,
      protocolIdentifier: asset.protocolIdentifier,
      positionType: 'borrow' as const
    }
    console.log('💾 Storing in onboarding context:', assetToStore)
    setOnboardingSelectedAsset(assetToStore)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Assets Available for Borrowing
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Loading the latest borrow opportunities...
          </p>
        </div>
        <LoadingSectionSkeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4 sm:mb-6"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
          Assets Available for Borrowing
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
          Choose from our available assets to borrow against your collateral.
        </p>
      </motion.div>

      {/* Assets Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="mobile-asset-grid">
            {borrowAssets.map((asset, index) => {
              const isSelected = selectedAsset === asset.symbol
              return (
                <motion.button
                  key={asset.symbol}
                  type="button"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAssetSelect(asset)}
                  className={`
                    mobile-asset-card relative text-left rounded-4 p-4 sm:p-6 border-2 transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50
                    ${isSelected
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/30'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }
                  `}
                >
                  {asset.popular && !isSelected && (
                    <div className="absolute -top-2 -right-2 bg-accent-lightBlue text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span className="hidden sm:inline">Popular</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">Selected</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {asset.logo ? (
                          <img 
                            src={asset.logo} 
                            alt={asset.symbol}
                            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling!.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <span className={`text-base sm:text-lg font-bold text-gray-700 ${asset.logo ? 'hidden' : ''}`}>
                          {asset.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                          {asset.symbol}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">{asset.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Borrow Rate</span>
                      <span className="text-base sm:text-lg font-bold text-accent-darkGreen">
                        {asset.borrowRate}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Max LTV</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {asset.maxLtv}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Risk Level</span>
                      <span className={`
                        text-xs sm:text-sm font-medium px-2 py-1 rounded-full
                        ${asset.risk === 'Low' 
                          ? 'bg-green-100 text-green-700' 
                          : asset.risk === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }
                      `}>
                        {asset.risk}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Available</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        ${(asset.availableLiquidity / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selection Feedback - Compact for mobile */}
      {selectedAsset && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-3 sm:mt-6 text-center px-2"
        >
          <p className="text-xs sm:text-sm text-primary font-medium">
            Great choice! You've selected {selectedAsset}. Click 'Continue' to proceed.
          </p>
        </motion.div>
      )}

      {/* Additional Info - Hidden on mobile for space */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-3 sm:mt-6 text-center space-y-2 sm:space-y-4 px-2 hidden sm:block"
      >
        <div className="bg-primary/5 rounded-4 p-3 sm:p-4 border border-primary/20">
          <p className="text-xs sm:text-sm text-gray-600">
            <strong>Live Data:</strong> Borrow rates are fetched in real-time from leading DeFi protocols. 
            Risk levels consider interest rates, utilization, and platform stability.
          </p>
        </div>
        
        <p className="text-xs text-gray-500">
          Risk assessment considers borrow rates, utilization, available liquidity, and protocol track record
        </p>
      </motion.div>
    </div>
  )
} 