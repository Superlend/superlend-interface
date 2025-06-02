import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Star, Check, RefreshCw } from 'lucide-react'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import { PlatformType } from '@/types/platform'

interface Asset {
  symbol: string
  name: string
  logo: string
  apy: string
  risk: 'Low' | 'Medium' | 'High'
  color: string
  bgColor: string
  popular: boolean
  utilization: number
  liquidity: number
  // Store full opportunity data for final step
  tokenAddress: string
  chainId: string
  protocolIdentifier: string
  platformName: string
  apyNumeric: number
}

export const EarnAssetsStep: React.FC = () => {
  const [lastRefetch, setLastRefetch] = useState<Date>(new Date())
  const { setSelectedAsset: setOnboardingSelectedAsset, currentStep, selectedAsset: contextSelectedAsset } = useOnboardingContext()
  
  // Initialize selectedAsset from context if available
  const [selectedAsset, setSelectedAsset] = useState<string | null>(() => {
    return contextSelectedAsset?.tokenSymbol || null
  })

  // Update local state when context changes (e.g., when coming back to this step)
  useEffect(() => {
    if (contextSelectedAsset?.tokenSymbol && contextSelectedAsset.positionType === 'lend') {
      setSelectedAsset(contextSelectedAsset.tokenSymbol)
    }
  }, [contextSelectedAsset])

  // Fetch real opportunities data with re-fetching capability
  const { data: opportunitiesData, isLoading, refetch } = useGetOpportunitiesData({
    type: 'lend',
    enabled: true,
  })

  // Auto-refetch when step becomes active or every 30 seconds while active
  useEffect(() => {
    if (currentStep === 'earn-assets') {
      // Initial refetch when step becomes active
      refetch()
      
      // Set up interval for background refetching every 30 seconds
      const interval = setInterval(() => {
        refetch()
        setLastRefetch(new Date())
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [currentStep, refetch])

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

  // Helper function to calculate risk level dynamically
  const calculateRiskLevel = (utilization: number, liquidity: number, platformName: string): 'Low' | 'Medium' | 'High' => {
    // Risk factors:
    // 1. High utilization rate (>80%) = higher risk
    // 2. Low liquidity (<$1M) = higher risk  
    // 3. Newer/less established protocols = higher risk

    const highRiskProtocols = ['morpho', 'fluid']
    const mediumRiskProtocols = ['compound', 'euler']
    const lowRiskProtocols = ['aave', 'superlend']
    
    const platformLower = platformName.toLowerCase()
    
    let riskScore = 0
    
    // Utilization risk
    if (utilization > 0.8) riskScore += 2
    else if (utilization > 0.6) riskScore += 1
    
    // Liquidity risk
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

  // Process and filter for stable tokens with mixed risk levels
  const assets: Asset[] = useMemo(() => {
    if (!opportunitiesData?.length) return []

    // Define stable tokens we want to show
    const stableTokens = ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD', 'FDUSD', 'PYUSD']
    
    // Filter for stable tokens that are available for LENDING (not borrowing)
    const stableOpportunities = opportunitiesData.filter(item => {
      const isStableToken = stableTokens.includes(item.token.symbol.toUpperCase())
      const hasLendingAPY = Number(item.platform.apy.current) > 0.1 // At least 0.1% APY
      const hasLiquidity = Number(item.platform.liquidity) > 0 // Has liquidity for lending
      const liquidityUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const hasMeaningfulLiquidity = liquidityUSD > 10000 // At least $10k liquidity
      
      // Exclude risky Morpho Markets (non-vaults) for lending - same logic as discover page
      const platformName = item.platform.platform_name?.split('-')[0]?.toLowerCase()
      const isMorpho = platformName === PlatformType.MORPHO
      const isVault = item.platform.isVault
      const excludeRiskyMorphoMarkets = true // Always exclude risky markets in onboarding
      const shouldExcludeMorphoMarkets = excludeRiskyMorphoMarkets && isMorpho && !isVault
      
      console.log('🔍 Filtering asset:', {
        symbol: item.token.symbol,
        isStableToken,
        hasLendingAPY,
        hasLiquidity,
        hasMeaningfulLiquidity,
        apy: item.platform.apy.current,
        liquidity: item.platform.liquidity,
        liquidityUSD: liquidityUSD,
        platformName: item.platform.platform_name,
        isMorpho,
        isVault,
        shouldExcludeMorphoMarkets,
        finalDecision: isStableToken && hasLendingAPY && hasLiquidity && hasMeaningfulLiquidity && !shouldExcludeMorphoMarkets
      })
      
      return isStableToken && hasLendingAPY && hasLiquidity && hasMeaningfulLiquidity && !shouldExcludeMorphoMarkets
    })

    console.log('✅ Filtered stable lending opportunities:', stableOpportunities.length)

    // Group by token symbol and get best APY for each
    const tokenMap = new Map<string, any>()
    
    stableOpportunities.forEach(item => {
      const existing = tokenMap.get(item.token.symbol)
      if (!existing || item.platform.apy.current > existing.platform.apy.current) {
        tokenMap.set(item.token.symbol, item)
      }
    })

    // Convert to array and calculate risk levels
    const processedAssets = Array.from(tokenMap.values()).map(item => {
      const liquidity = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const utilization = item.platform.utilization_rate || 0
      const platformName = item.platform.platform_name?.split('-')[0] || ''
      
      const risk = calculateRiskLevel(utilization, liquidity, platformName)
      
      console.log('📊 Processed asset:', {
        symbol: item.token.symbol,
        apy: item.platform.apy.current,
        risk,
        liquidity,
        utilization,
        platform: platformName
      })
      
      return {
        symbol: item.token.symbol,
        name: item.token.name,
        logo: item.token.logo,
        apy: `${item.platform.apy.current.toFixed(1)}%`,
        apyNumeric: item.platform.apy.current,
        risk,
        color: getRiskColor(risk),
        bgColor: getRiskBgColor(risk),
        popular: ['USDC', 'USDT', 'DAI'].includes(item.token.symbol.toUpperCase()),
        utilization,
        liquidity,
        // Store data needed for navigation
        tokenAddress: item.token.address,
        chainId: item.chain_id,
        protocolIdentifier: item.platform.protocol_identifier,
        platformName: item.platform.platform_name
      }
    })

    console.log('🎯 Final processed assets:', processedAssets)

    // Ensure we have a good mix of risk levels - try to get 1 low, 2 medium, 1 high
    const lowRisk = processedAssets.filter(a => a.risk === 'Low').sort((a, b) => b.apyNumeric - a.apyNumeric)
    const mediumRisk = processedAssets.filter(a => a.risk === 'Medium').sort((a, b) => b.apyNumeric - a.apyNumeric)
    const highRisk = processedAssets.filter(a => a.risk === 'High').sort((a, b) => b.apyNumeric - a.apyNumeric)

    console.log('📈 Risk distribution:', {
      low: lowRisk.length,
      medium: mediumRisk.length, 
      high: highRisk.length
    })

    const finalAssets = [
      ...lowRisk.slice(0, 1),     // 1 low risk
      ...mediumRisk.slice(0, 2),  // 2 medium risk  
      ...highRisk.slice(0, 1)     // 1 high risk
    ]

    // If we don't have enough variety, fill with highest APY remaining assets
    if (finalAssets.length < 4) {
      const remaining = processedAssets
        .filter(asset => !finalAssets.find(selected => selected.symbol === asset.symbol))
        .sort((a, b) => b.apyNumeric - a.apyNumeric)
      
      finalAssets.push(...remaining.slice(0, 4 - finalAssets.length))
    }

    const result = finalAssets.slice(0, 4)
    console.log('🏆 Final 4 assets selected:', result.map(a => ({ symbol: a.symbol, apy: a.apy, risk: a.risk })))
    
    return result
  }, [opportunitiesData])

  const handleAssetSelect = (asset: Asset) => {
    console.log('💰 Asset selected:', asset.symbol)
    console.log('📦 Full asset data:', asset)
    setSelectedAsset(asset.symbol)
    
    // Store in onboarding context for final step
    const assetToStore = {
      tokenAddress: asset.tokenAddress,
      tokenSymbol: asset.symbol,
      chainId: asset.chainId,
      protocolIdentifier: asset.protocolIdentifier,
      positionType: 'lend' as const
    }
    console.log('💾 Storing in onboarding context:', assetToStore)
    setOnboardingSelectedAsset(assetToStore)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Stable Tokens for Earning
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Loading the latest stable token yield opportunities...
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
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Stable Tokens for Earning
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
          Choose from our curated selection of 4 stable tokens with different risk profiles.
        </p>
        <p className="text-xs text-gray-500 mt-1 sm:mt-2">
          Last updated: {lastRefetch.toLocaleTimeString()}
        </p>
      </motion.div>

      {/* Assets Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="mobile-asset-grid">
            {assets.map((asset, index) => {
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
                      <span className="text-xs sm:text-sm text-gray-600">Current APY</span>
                      <span className="text-base sm:text-lg font-bold text-accent-darkGreen">
                        {asset.apy}
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
            <strong>Live Data:</strong> APY rates are fetched in real-time from leading DeFi protocols. 
            Risk levels are calculated based on utilization rates, liquidity, and protocol maturity.
          </p>
        </div>
        
        <p className="text-xs text-gray-500">
          Risk assessment considers utilization rate, available liquidity, and protocol track record
        </p>
      </motion.div>
    </div>
  )
} 