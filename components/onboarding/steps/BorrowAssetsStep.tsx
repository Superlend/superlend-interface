import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Star, Check, AlertCircle, RefreshCw } from 'lucide-react'
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
        borrowRate: `${Math.abs(borrowRate).toFixed(2)}%`,
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
      {/* Enhanced Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4 sm:mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Assets Available for Borrowing
          </h2>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-gray-400"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
          Access liquidity by borrowing against your collateral with competitive rates.
        </p>
        <p className="text-xs text-gray-500 mt-1 sm:mt-2">
          Real-time rates from leading DeFi protocols
        </p>
      </motion.div>

      {/* Assets Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          {/* Enhanced Risk Level Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-3">Understanding Borrowing Risk Levels</h4>
                <p className="text-sm text-gray-600 mb-4">Each asset is categorized by borrowing risk to help you make informed decisions</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl p-4 border border-green-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-700">Low Risk</span>
                    </div>
                    <p className="text-xs text-gray-600">Established protocols with low rates and proven stability</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="font-semibold text-yellow-700">Medium Risk</span>
                    </div>
                    <p className="text-xs text-gray-600">Moderate rates with balanced risk and good liquidity</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl p-4 border border-red-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="font-semibold text-red-700">High Risk</span>
                    </div>
                    <p className="text-xs text-gray-600">Higher rates but increased exposure to protocol risk</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-gray-500 font-medium">Select Your Asset</span>
            </div>
          </div>

          {/* Enhanced Token Grid */}
          <div className="mobile-asset-grid">
            {borrowAssets.map((asset, index) => {
              const isSelected = selectedAsset === asset.symbol
              return (
                <motion.button
                  key={asset.symbol}
                  type="button"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -4,
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAssetSelect(asset)}
                  className={`
                    mobile-asset-card relative text-left rounded-2xl p-6 border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 group
                    ${isSelected
                      ? 'border-primary bg-gradient-to-br from-primary/15 to-primary/10 ring-4 ring-primary/20 shadow-xl'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 shadow-md'
                    }
                  `}
                >
                  {/* Enhanced Selection Badge */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, type: "spring" }}
                      className="absolute -top-3 -right-3 bg-primary text-white text-sm px-3 py-1 rounded-full flex items-center space-x-2 shadow-lg z-10"
                    >
                      <Check className="w-4 h-4" />
                      <span className="font-medium">Selected</span>
                    </motion.div>
                  )}

                  {/* Token Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {asset.logo ? (
                          <img 
                            src={asset.logo} 
                            alt={asset.symbol}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling!.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <span className={`text-lg font-bold text-gray-700 ${asset.logo ? 'hidden' : ''}`}>
                          {asset.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                          {asset.symbol}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{asset.name}</p>
                      </div>
                    </div>

                    {/* Risk Badge - Made smaller and less prominent */}
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2
                      ${asset.risk === 'Low' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : asset.risk === 'Medium'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                      }
                    `}>
                      {asset.risk}
                    </div>
                  </div>

                  {/* Borrow Rate Display - Enhanced like APY */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Borrow Rate</span>
                      <span className="text-2xl font-bold text-blue-700">
                        {asset.borrowRate}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Real-time rate • Updates every 30 seconds
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Max LTV</span>
                      <span className="text-xs font-medium text-gray-700">
                        {asset.maxLtv}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Available</span>
                      <span className="text-xs font-medium text-gray-700">
                        ${(asset.availableLiquidity / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>

                  {/* Hover Indicator */}
                  <div className={`
                    text-center py-2 rounded-lg border-2 border-dashed transition-all duration-300
                    ${isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-300 text-gray-500 group-hover:border-primary group-hover:text-primary'
                    }
                  `}>
                    <span className="text-sm font-medium">
                      {isSelected ? '✓ Selected' : 'Click to select'}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Live Data Information */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-4 text-center px-2"
      >
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
          <p className="text-xs text-gray-600">
            <strong>Live Data:</strong> Borrow rates are fetched in real-time from leading DeFi protocols. 
            Risk levels consider interest rates, utilization, and platform stability.
          </p>
        </div>
      </motion.div>

      {/* Selection Feedback - Compact for mobile */}
      {selectedAsset && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-3 text-center px-2"
        >
          <p className="text-xs sm:text-sm text-primary font-medium">
            Great choice! You&apos;ve selected {selectedAsset}. Click &quot;Next&quot; to proceed.
          </p>
        </motion.div>
      )}
    </div>
  )
} 