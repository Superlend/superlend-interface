import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Star, Check, RefreshCw, AlertCircle, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import { PlatformType } from '@/types/platform'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { getTokenLogo } from '@/lib/utils'
import Image from 'next/image'
// import { useAppleFarmRewards } from '@/context/apple-farm-rewards-provider'

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

type TokenType = 'USDC' | 'USDT' | 'WBTC' | 'WETH'
type RiskLevel = 'Low' | 'Medium' | 'High'

export const EarnAssetsStep: React.FC = () => {
  // const [lastRefetch, setLastRefetch] = useState<Date>(new Date())
  const {
    setSelectedAsset: setOnboardingSelectedAsset,
    clearSelectedAsset, currentStep,
    selectedAsset: contextSelectedAsset,
    lendOpportunitiesData,
    isLoadingLendOpportunitiesData,
    isErrorLendOpportunitiesData,
    refetchLendOpportunitiesData,
    positionType,
    setPositionType
  } = useOnboardingContext()
  // Filter states
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType | null>(null)
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | null>(null)
  // const { appleFarmRewardsAprs } = useAppleFarmRewards()

  // Initialize selectedAsset from context if available - use unique identifier
  const [selectedAsset, setSelectedAsset] = useState<string | null>(() => {
    if (contextSelectedAsset?.tokenSymbol && contextSelectedAsset?.protocolIdentifier) {
      return `${contextSelectedAsset.tokenSymbol}-${contextSelectedAsset.protocolIdentifier}`
    }
    return null
  })

  // Smooth scroll function with optional delay
  const smoothScrollToSection = (sectionId: string, delay: number = 0) => {
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, delay)
  }

  // useEffect(() => {
  //   if (positionType === 'borrow') {
  //     setPositionType('lend')
  //   }
  // }, [positionType])

  // Update local state when context changes (e.g., when coming back to this step)
  useEffect(() => {
    if (contextSelectedAsset?.tokenSymbol && contextSelectedAsset?.protocolIdentifier && contextSelectedAsset.positionType === 'lend') {
      setSelectedAsset(`${contextSelectedAsset.tokenSymbol}-${contextSelectedAsset.protocolIdentifier}`)
      // Try to infer filters from context if available, but don't set them as this could cause issues
      // The user should re-select their filters to ensure data freshness
    } else {
      // Clear local state if context is cleared
      setSelectedAsset(null)
    }
  }, [contextSelectedAsset])

  // Only clear state when first entering the step, not on every render
  useEffect(() => {
    if (currentStep === 'earn-assets' && !contextSelectedAsset) {
      // Only reset if there's no existing context selection AND we're not preserving user selections
      // This prevents clearing selections when users navigate between steps
      const shouldPreserveSelections = selectedTokenType || selectedRiskLevel || selectedAsset

      if (!shouldPreserveSelections) {
        setSelectedTokenType(null)
        setSelectedRiskLevel(null)
        setSelectedAsset(null)
      }
    }
  }, [currentStep, contextSelectedAsset, selectedTokenType, selectedRiskLevel, selectedAsset])

  // Only fetch data when both filters are selected
  const shouldFetchData = Boolean(selectedTokenType && selectedRiskLevel)

  // Filter opportunities data by selected token type
  const filteredOpportunitiesByTokenType = useMemo(() => {
    if (!lendOpportunitiesData?.length) return []
    return lendOpportunitiesData.filter((item: any) => item.token.symbol.toUpperCase() === selectedTokenType)
  }, [lendOpportunitiesData, selectedTokenType])

  // Auto-refetch when step becomes active or every 30 seconds while active
  // useEffect(() => {
  //   if (currentStep === 'earn-assets' && shouldFetchData) {
  //     // Initial refetch when step becomes active
  //     refetchOpportunitiesData()

  //     // Set up interval for background refetching every 30 seconds
  //     const interval = setInterval(() => {
  //       refetchOpportunitiesData()
  //       setLastRefetch(new Date())
  //     }, 30000)

  //     return () => clearInterval(interval)
  //   }
  // }, [currentStep, refetchOpportunitiesData, shouldFetchData])

  // Reset dependent states when token type changes and scroll to next section
  useEffect(() => {
    if (selectedTokenType) {
      setSelectedRiskLevel(null)
      setSelectedAsset(null)
      // Scroll to risk level section
      smoothScrollToSection('risk-level-section')
    }
  }, [selectedTokenType])

  // Reset asset selection when risk level changes and scroll to next section
  useEffect(() => {
    if (selectedRiskLevel) {
      setSelectedAsset(null)
      // Scroll to token selection section
      smoothScrollToSection('token-selection-section')
    }
  }, [selectedRiskLevel])

  // Helper functions for risk styling
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

  // Process opportunities data and filter by selected risk level
  const assets: Asset[] = useMemo(() => {
    if (!filteredOpportunitiesByTokenType?.length || !selectedRiskLevel) return []

    // Filter for the selected token type and process the data
    const filteredOpportunities = filteredOpportunitiesByTokenType.filter((item: any) => {
      const isSelectedToken = item.token.symbol.toUpperCase() === selectedTokenType
      const hasLendingAPY = Number(item.platform.apy.current) > 0.1
      const hasLiquidity = Number(item.platform.liquidity) > 0
      const liquidityUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const hasMeaningfulLiquidity = liquidityUSD > 10000

      // Exclude risky Morpho Markets (non-vaults) for lending
      const platformName = item.platform.platform_name?.split('-')[0]?.toLowerCase()
      const isMorpho = platformName === PlatformType.MORPHO
      const isVault = item.platform.isVault
      const excludeRiskyMorphoMarkets = true
      const excludeCompoundMarkets = true
      const excludeEulerMarkets = true
      const isEuler = platformName === PlatformType.EULER
      const isCompound = platformName === PlatformType.COMPOUND
      const shouldExcludeMorphoMarkets = excludeRiskyMorphoMarkets && isMorpho && !isVault
      const shouldExcludeEulerMarkets = excludeEulerMarkets && isEuler
      const shouldExcludeCompoundMarkets = excludeCompoundMarkets && isCompound

      return isSelectedToken && hasLendingAPY && hasLiquidity && hasMeaningfulLiquidity && !shouldExcludeMorphoMarkets && !shouldExcludeEulerMarkets && !shouldExcludeCompoundMarkets
    })

    // Process and filter by risk level
    const processedAssets = filteredOpportunities.map((item: any) => {
      const liquidity = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const utilization = Number(item.platform.utilization_rate) || 0
      const platformName = item.platform.platform_name?.split('-')[0] || ''

      const risk = calculateRiskLevel(utilization, liquidity, platformName)

      return {
        symbol: item.token.symbol,
        name: item.token.name,
        logo: item.token.logo,
        apy: `${Number(item.platform.apy.current).toFixed(1)}%`,
        apyNumeric: Number(item.platform.apy.current),
        risk,
        color: getRiskColor(risk),
        bgColor: getRiskBgColor(risk),
        popular: ['USDC', 'USDT', 'DAI'].includes(item.token.symbol.toUpperCase()),
        utilization,
        liquidity,
        tokenAddress: item.token.address,
        chainId: item.chain_id.toString(),
        protocolIdentifier: item.platform.protocol_identifier,
        platformName: item.platform.platform_name
      }
    })

    // Filter by selected risk level and sort by APY (highest to lowest)
    const riskFilteredAssets = processedAssets
      .filter((asset: any) => asset.risk === selectedRiskLevel)
      .sort((a: any, b: any) => b.apyNumeric - a.apyNumeric)
      .slice(0, 3) // Limit to 3 results

    console.log('🎯 Final filtered assets:', riskFilteredAssets)
    return riskFilteredAssets
  }, [filteredOpportunitiesByTokenType, selectedRiskLevel, selectedTokenType])

  const handleAssetSelect = (asset: Asset) => {
    console.log('💰 Asset selected:', asset.symbol, asset.protocolIdentifier)
    const uniqueAssetId = `${asset.symbol}-${asset.protocolIdentifier}`
    setSelectedAsset(uniqueAssetId)

    // Store in onboarding context for final step
    const assetToStore = {
      tokenAddress: asset.tokenAddress,
      tokenSymbol: asset.symbol,
      chainId: asset.chainId,
      protocolIdentifier: asset.protocolIdentifier,
      positionType: 'lend' as const
    }
    setOnboardingSelectedAsset(assetToStore)

    // Scroll to summary section
    smoothScrollToSection('selection-summary-section')
  }

  // Token type options with logos
  const tokenTypes: { symbol: TokenType; name: string; description: string; logo: string }[] = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      description: 'Most liquid stablecoin',
      logo: '/images/tokens/usdc.webp'
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      description: 'Largest stablecoin by market cap',
      logo: '/images/tokens/usdt.webp'
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      description: 'Bitcoin on Ethereum',
      logo: getTokenLogo('WBTC')
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      description: 'ERC-20 version of ETH token',
      logo: getTokenLogo('WETH')
    },
  ]

  // Risk level options with tooltip content
  const riskLevels: {
    level: RiskLevel;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    tooltipContent: React.ReactNode;
  }[] = [
      {
        level: 'Low',
        title: 'Low Risk',
        description: 'Established protocols with proven track records',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
        tooltipContent: (
          <div className="space-y-3">
            <h4 className="font-semibold text-green-800 text-sm">Low Risk Characteristics</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Utilization rates below 60%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>High liquidity above $10M</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Established platforms (Aave, Superlend)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Proven track records & audits</span>
              </li>
            </ul>
          </div>
        )
      },
      {
        level: 'Medium',
        title: 'Medium Risk',
        description: 'Higher yields with moderate exposure',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
        tooltipContent: (
          <div className="space-y-3">
            <h4 className="font-semibold text-yellow-800 text-sm">Medium Risk Characteristics</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Utilization rates 60-80%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Moderate liquidity $1M-$10M</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Established platforms (Compound, Euler)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Balanced risk-reward profile</span>
              </li>
            </ul>
          </div>
        )
      },
      {
        level: 'High',
        title: 'High Risk',
        description: 'Newest protocols with highest potential',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
        tooltipContent: (
          <div className="space-y-3">
            <h4 className="font-semibold text-red-800 text-sm">High Risk Characteristics</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Utilization rates above 80%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Lower liquidity below $1M</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Newer platforms (Morpho markets)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Higher potential returns</span>
              </li>
            </ul>
          </div>
        )
      },
    ]

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex md:items-center md:justify-center mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${selectedTokenType
            ? 'bg-primary border-primary text-white'
            : 'border-primary text-primary bg-white'
            }`}>
            {selectedTokenType ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className={`ml-2 text-sm font-medium ${selectedTokenType ? 'text-primary' : 'text-gray-600'}`}>
            Token Type
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${selectedRiskLevel
            ? 'bg-primary border-primary text-white'
            : selectedTokenType
              ? 'border-primary text-primary bg-white'
              : 'border-gray-300 text-gray-400 bg-gray-50'
            }`}>
            {selectedRiskLevel ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className={`ml-2 text-sm font-medium ${selectedRiskLevel ? 'text-primary' : selectedTokenType ? 'text-gray-700' : 'text-gray-600'
            }`}>
            Risk Level
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        {/* Step 3 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${selectedAsset
            ? 'bg-primary border-primary text-white'
            : shouldFetchData
              ? 'border-primary text-primary bg-white'
              : 'border-gray-300 text-gray-400 bg-gray-50'
            }`}>
            {selectedAsset ? <Check className="w-4 h-4" /> : '3'}
          </div>
          <span className={`ml-2 text-sm font-medium ${selectedAsset ? 'text-primary' : shouldFetchData ? 'text-gray-700' : 'text-gray-600'
            }`}>
            Final Selection
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Select Token for Earning
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
          Follow the 3 steps below to find the perfect earning opportunity for you.
        </p>
      </motion.div>

      {/* Step Indicator */}
      <StepIndicator />

      <div className="flex-1 space-y-8">
        {/* Step 1: Token Type Selection */}
        <motion.div
          id="token-type-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`border-2 rounded-2xl p-6 transition-all duration-300 ${selectedTokenType ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'
            }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedTokenType ? 'bg-primary border-primary text-white' : 'border-primary text-primary'
              }`}>
              {selectedTokenType ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <h3 className="text-lg font-semibold text-foreground">Choose Token Type</h3>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {tokenTypes.map((token) => (
              <motion.button
                key={token.symbol}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTokenType(token.symbol)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${selectedTokenType === token.symbol
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <Image
                    src={token.logo}
                    alt={token.symbol}
                    className="w-5 h-5 object-contain"
                    width={20}
                    height={20}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  <div className="font-bold text-lg text-foreground">{token.symbol}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{token.name}</div>
                <div className="text-xs text-gray-500 mt-1">{token.description}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Risk Level Selection */}
        <motion.div
          id="risk-level-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: selectedTokenType ? 1 : 0.5,
            y: 0
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`border-2 rounded-2xl p-6 transition-all duration-300 ${selectedRiskLevel ? 'border-green-200 bg-green-50/50'
            : selectedTokenType ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50'
            }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedRiskLevel ? 'bg-primary border-primary text-white'
              : selectedTokenType ? 'border-primary text-primary'
                : 'border-gray-300 text-gray-400'
              }`}>
              {selectedRiskLevel ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <h3 className={`text-lg font-semibold ${selectedTokenType ? 'text-foreground' : 'text-gray-400'}`}>
              Select Risk Level
            </h3>
          </div>

          {!selectedTokenType && (
            <p className="text-sm text-gray-500 mb-4">Please select a token type first</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {riskLevels.map((risk) => (
              <motion.button
                key={risk.level}
                whileHover={selectedTokenType ? { scale: 1.02 } : {}}
                whileTap={selectedTokenType ? { scale: 0.98 } : {}}
                onClick={() => selectedTokenType && setSelectedRiskLevel(risk.level)}
                disabled={!selectedTokenType}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${selectedRiskLevel === risk.level
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : selectedTokenType
                    ? `${risk.bgColor} border-opacity-60 hover:border-opacity-100`
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                  }`}
              >
                <div className={`flex items-center space-x-2 mb-2 ${selectedTokenType ? risk.color : 'text-gray-400'
                  }`}>
                  <div className={`w-3 h-3 rounded-full ${risk.level === 'Low' ? 'bg-green-500'
                    : risk.level === 'Medium' ? 'bg-yellow-500'
                      : 'bg-red-500'
                    } ${!selectedTokenType ? 'opacity-40' : ''}`}></div>
                  <span className="font-semibold">{risk.title}</span>
                  <InfoTooltip
                    content={risk.tooltipContent}
                    side="top"
                    className="max-w-sm"
                  />
                </div>
                <p className={`text-xs ${selectedTokenType ? 'text-gray-600' : 'text-gray-400'}`}>
                  {risk.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Step 3: Final Token Selection */}
        <motion.div
          id="token-selection-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: shouldFetchData ? 1 : 0.5,
            y: 0
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`border-2 rounded-2xl p-6 transition-all duration-300 ${selectedAsset ? 'border-green-200 bg-green-50/50'
            : shouldFetchData ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50'
            }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedAsset ? 'bg-primary border-primary text-white'
              : shouldFetchData ? 'border-primary text-primary'
                : 'border-gray-300 text-gray-400'
              }`}>
              {selectedAsset ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <h3 className={`text-lg font-semibold ${shouldFetchData ? 'text-foreground' : 'text-gray-400'}`}>
              Select <span className="hidden md:inline">Your</span> Token
            </h3>
            {shouldFetchData && isLoadingLendOpportunitiesData && (
              <div className="text-blue-500 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs text-blue-600 font-medium">Fetching tokens...</span>
              </div>
            )}
            {shouldFetchData && !isLoadingLendOpportunitiesData && !isErrorLendOpportunitiesData && (
              <div className="text-green-500 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs text-green-600 font-medium">Tokens fetched</span>
              </div>
            )}
            {shouldFetchData && !isLoadingLendOpportunitiesData && isErrorLendOpportunitiesData && (
              <div className="text-red-500 flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs text-red-600 font-medium">Failed to fetch tokens</span>
              </div>
            )}
          </div>

          {!shouldFetchData && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select filters to proceed with Token selection</p>
              <p className="text-sm text-gray-400 mt-1">Choose a token type and risk level above</p>
            </div>
          )}

          {shouldFetchData && isLoadingLendOpportunitiesData && (
            <LoadingSectionSkeleton className="h-[200px]" />
          )}

          {shouldFetchData && !isLoadingLendOpportunitiesData && assets.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No {selectedRiskLevel?.toLowerCase()} risk {selectedTokenType} opportunities found</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different risk level</p>
            </div>
          )}

          {shouldFetchData && !isLoadingLendOpportunitiesData && assets.length > 0 && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Showing <span className="font-bold">Top {assets.slice(0, 3).length}</span> {selectedRiskLevel?.toLowerCase()} risk {selectedTokenType} opportunitie{assets.length > 1 ? 's' : ''}
                {/* {lastRefetch && (
                  <span className="text-xs text-gray-500 ml-2">
                    • Last updated: {lastRefetch.toLocaleTimeString()}
                  </span>
                )} */}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset, index) => {
                  const uniqueAssetId = `${asset.symbol}-${asset.protocolIdentifier}`
                  const isSelected = selectedAsset === uniqueAssetId
                  return (
                    <motion.button
                      key={`${asset.symbol}-${asset.protocolIdentifier}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAssetSelect(asset)}
                      className={`relative text-left rounded-xl p-4 border-2 transition-all duration-300 ${isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Selected</span>
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            {asset.logo ? (
                              <img
                                src={asset.logo}
                                alt={asset.symbol}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-700">
                                {asset.symbol.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground">{asset.symbol}</h4>
                            <p className="text-xs text-gray-500">{asset.platformName.split('-')[0]}</p>
                          </div>
                        </div>

                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${asset.bgColor} ${asset.color} border`}>
                          {asset.risk}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">APY</span>
                          <span className="text-lg font-bold text-green-700">{asset.apy}</span>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Selection Summary */}
      {selectedAsset && selectedRiskLevel && selectedTokenType && (
        <motion.div
          id="selection-summary-section"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-6 text-center"
        >
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <p className="text-sm text-primary font-medium">
              Perfect! You&apos;ve selected {selectedAsset?.split('-')[0]} with {selectedRiskLevel?.toLowerCase()} risk. Click &quot;Next&quot; to proceed.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
} 