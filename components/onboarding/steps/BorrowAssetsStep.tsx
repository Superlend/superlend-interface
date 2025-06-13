import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Star, Check, RefreshCw, AlertCircle, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import { PlatformType } from '@/types/platform'
import { useAssetsDataContext } from '@/context/data-provider'
import { getTokenLogo } from '@/lib/utils'
import Image from 'next/image'
import InfoTooltip from '@/components/tooltips/InfoTooltip'

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
  // Store full opportunity data for final step
  tokenAddress: string
  chainId: string
  protocolIdentifier: string
  platformName: string
  borrowRateNumeric: number
  collateralTokens?: any[] // Added for collateral data
}

interface CollateralToken {
  address: string // Store the actual token address
  symbol: string
  name: string
  logo: string
  marketCount: number
  riskLevel: 'Low' | 'Medium' | 'High'
  color: string
  bgColor: string
}

type TokenType = 'USDC' | 'USDT' | 'FRAX' | 'DAI' | 'WBTC' | 'WETH'
type RiskLevel = 'Low' | 'Medium' | 'High'

export const BorrowAssetsStep: React.FC = () => {
  // const [lastRefetch, setLastRefetch] = useState<Date>(new Date())
  const {
    setSelectedAsset: setOnboardingSelectedAsset,
    clearSelectedAsset, currentStep,
    selectedAsset: contextSelectedAsset,
    borrowOpportunitiesData,
    isLoadingBorrowOpportunitiesData,
    isErrorBorrowOpportunitiesData,
    refetchBorrowOpportunitiesData,
    setPositionType,
    positionType
  } = useOnboardingContext()
  const { allTokensData } = useAssetsDataContext()

  // Filter states
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType | null>(null)
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | null>(null)
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<string | null>(null)

  // Initialize selectedAsset from context if available - use unique identifier
  const [selectedAsset, setSelectedAsset] = useState<string | null>(() => {
    if (contextSelectedAsset?.tokenSymbol && contextSelectedAsset?.protocolIdentifier) {
      return `${contextSelectedAsset.tokenSymbol}-${contextSelectedAsset.protocolIdentifier}`
    }
    return null
  })

  // State to track refresh button visibility
  const [isRefreshButtonHidden, setIsRefreshButtonHidden] = useState(false)

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

  // Filter opportunities data by selected token type
  const filteredOpportunitiesByTokenType = useMemo(() => {
    if (!borrowOpportunitiesData?.length) return []
    return borrowOpportunitiesData.filter((item: any) => item.token.symbol.toUpperCase() === selectedTokenType)
  }, [borrowOpportunitiesData, selectedTokenType])

  // Custom refresh handler that manages button visibility
  // const handleRefresh = async () => {
  //   try {
  //     await refetch()
  //     // Hide the refresh button for 3 seconds after successful refresh
  //     setIsRefreshButtonHidden(true)
  //     setTimeout(() => {
  //       setIsRefreshButtonHidden(false)
  //     }, 3000)
  //     setLastRefetch(new Date())
  //   } catch (error) {
  //     // If there's an error, don't hide the button
  //     console.error('Refresh failed:', error)
  //   }
  // }

  // useEffect(() => {
  //   if (positionType === 'lend') {
  //     setPositionType('borrow')
  //   }
  // }, [])

  // Update local state when context changes (e.g., when coming back to this step)
  useEffect(() => {
    if (contextSelectedAsset?.tokenSymbol && contextSelectedAsset?.protocolIdentifier && contextSelectedAsset.positionType === 'borrow') {
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
    if (currentStep === 'borrow-assets' && !contextSelectedAsset) {
      // Only reset if there's no existing context selection AND we're not preserving user selections
      // This prevents clearing selections when users navigate between steps
      const shouldPreserveSelections = selectedTokenType || selectedRiskLevel || selectedCollateralToken || selectedAsset

      if (!shouldPreserveSelections) {
        setSelectedTokenType(null)
        setSelectedRiskLevel(null)
        setSelectedCollateralToken(null)
        setSelectedAsset(null)
      }
    }
  }, [currentStep, contextSelectedAsset])

  // Only fetch data when both filters are selected
  const shouldFetchData = Boolean(selectedTokenType && selectedRiskLevel)

  // Fetch real opportunities data with filtering
  // const { data: opportunitiesData, isLoading, isError, refetch } = useGetOpportunitiesData({
  //   type: 'borrow',
  //   enabled: shouldFetchData,
  //   tokens: [], // Fetch all tokens instead of filtering by selectedTokenType
  //   trend: true, // Explicitly set trend parameter for consistency
  // })

  // Force refetch when both filters are selected to ensure fresh data
  // useEffect(() => {
  //   if (shouldFetchData && !isLoadingOpportunitiesData) {
  //     console.log('🚀 Both filters selected, forcing refetch')
  //     refetchOpportunitiesData()
  //   }
  // }, [shouldFetchData, refetchOpportunitiesData, selectedTokenType, selectedRiskLevel])

  // Auto-refetch when step becomes active or every 30 seconds while active
  // useEffect(() => {
  //   if (currentStep === 'borrow-assets' && shouldFetchData) {
  //     console.log('🔄 Triggering data refetch for:', { selectedTokenType, selectedRiskLevel })

  //     // Initial refetch when step becomes active
  //     refetchOpportunitiesData()

  //     // Set up interval for background refetching every 30 seconds
  //     const interval = setInterval(() => {
  //       // Only auto-refresh if user isn't actively refreshing
  //       if (!isLoadingOpportunitiesData && !isRefreshButtonHidden) {
  //         console.log('🔄 Auto-refetching data for:', { selectedTokenType, selectedRiskLevel })
  //         refetchOpportunitiesData()
  //         // setLastRefetch(new Date())
  //       }
  //     }, 30000)

  //     return () => clearInterval(interval)
  //   }
  // }, [currentStep, refetchOpportunitiesData, shouldFetchData, selectedTokenType, selectedRiskLevel])

  /* 
   * STATE MANAGEMENT LOGIC:
   * 1. When token type changes: Reset risk level, collateral, and asset (makes sense as different tokens have different opportunities)
   * 2. When risk level changes: Only reset final asset selection, keep collateral if still valid
   * 3. When collateral changes: Only reset final asset selection
   * 4. Intelligent validation: If selected collateral becomes invalid for new risk level, clear it automatically
   * 5. Navigation preservation: Don't reset selections when navigating between steps
   */

  // Reset dependent states when token type changes and scroll to next section
  useEffect(() => {
    if (selectedTokenType) {
      // Use setTimeout to prevent race conditions with data fetching
      setTimeout(() => {
        setSelectedRiskLevel(null)
        setSelectedCollateralToken(null)
        setSelectedAsset(null)
        setIsRefreshButtonHidden(false) // Reset refresh button visibility
      }, 0)
      // Scroll to risk level section
      smoothScrollToSection('risk-level-section')
    }
  }, [selectedTokenType])

  // Reset asset selection when risk level changes and scroll to next section
  useEffect(() => {
    if (selectedRiskLevel) {
      // Use setTimeout to prevent race conditions with data fetching
      setTimeout(() => {
        // Only reset collateral and asset if the selected collateral is no longer valid for the new risk level
        // This will be handled by the collateral processing logic automatically
        setSelectedAsset(null)
        setIsRefreshButtonHidden(false) // Reset refresh button visibility
      }, 0)
      // Scroll to collateral selection section
      smoothScrollToSection('collateral-selection-section')
    }
  }, [selectedRiskLevel])

  // Reset final selection when collateral changes and scroll to next section
  useEffect(() => {
    if (selectedCollateralToken) {
      setTimeout(() => {
        setSelectedAsset(null)
      }, 0)
      // Scroll to market selection section
      smoothScrollToSection('market-selection-section')
    }
  }, [selectedCollateralToken])

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
    const riskFactors: string[] = []

    // Borrow rate risk (higher rates = higher cost risk) - Made less restrictive
    if (borrowRate > 12) {
      riskScore += 2
      riskFactors.push(`High borrow rate: ${borrowRate}% (+2)`)
    } else if (borrowRate > 8) {
      riskScore += 1
      riskFactors.push(`Medium borrow rate: ${borrowRate}% (+1)`)
    }

    // Utilization risk (higher utilization = less available liquidity) - Made less restrictive
    if (utilization > 0.9) {
      riskScore += 2
      riskFactors.push(`Very high utilization: ${(utilization * 100).toFixed(1)}% (+2)`)
    } else if (utilization > 0.8) {
      riskScore += 1
      riskFactors.push(`High utilization: ${(utilization * 100).toFixed(1)}% (+1)`)
    }

    // Liquidity risk (less available liquidity = harder to borrow more) - Made less restrictive
    if (liquidity < 100000) {
      riskScore += 2
      riskFactors.push(`Very low liquidity: $${(liquidity / 1000).toFixed(0)}K (+2)`)
    } else if (liquidity < 1000000) {
      riskScore += 1
      riskFactors.push(`Low liquidity: $${(liquidity / 1000000).toFixed(1)}M (+1)`)
    }

    // Protocol risk
    if (highRiskProtocols.some(p => platformLower.includes(p))) {
      riskScore += 1
      riskFactors.push(`High risk protocol: ${platformName} (+1)`)
    } else if (mediumRiskProtocols.some(p => platformLower.includes(p))) {
      riskScore += 0
      riskFactors.push(`Medium risk protocol: ${platformName} (+0)`)
    } else if (lowRiskProtocols.some(p => platformLower.includes(p))) {
      riskScore -= 1
      riskFactors.push(`Low risk protocol: ${platformName} (-1)`)
    }

    // More lenient risk classification - ADJUSTED
    let finalRisk: 'Low' | 'Medium' | 'High'
    if (riskScore >= 3) {
      finalRisk = 'High'
    } else if (riskScore >= 2) {
      finalRisk = 'Medium'
    } else {
      finalRisk = 'Low'
    }

    // Add debugging for risk calculation
    console.log(`🎲 Risk calculation for ${platformName}:`, {
      borrowRate: `${borrowRate}%`,
      utilization: `${(utilization * 100).toFixed(1)}%`,
      liquidity: `$${(liquidity / 1000000).toFixed(2)}M`,
      riskFactors,
      totalScore: riskScore,
      finalRisk
    })

    return finalRisk
  }

  // Helper function to normalize token symbols for comparison
  const normalizeTokenSymbol = (symbol: string): string => {
    const symbolUpper = symbol.toUpperCase()
    // Handle common symbol variations
    const symbolMap: Record<string, string> = {
      'WMATIC': 'MATIC',
      'WETH': 'ETH',
      'WBTC': 'BTC'
    }
    return symbolMap[symbolUpper] || symbolUpper
  }

  // Helper function to check if token matches selected type
  const isTokenMatch = (tokenSymbol: string, selectedType: TokenType | null): boolean => {
    if (!selectedType) return false
    const normalizedToken = normalizeTokenSymbol(tokenSymbol)
    const normalizedSelected = normalizeTokenSymbol(selectedType)
    return normalizedToken === normalizedSelected || tokenSymbol.toUpperCase() === selectedType
  }

  // Process collateral tokens from opportunities data
  const collateralTokens: CollateralToken[] = useMemo(() => {
    console.log('🏷️ Processing collateral tokens with risk filter:', {
      selectedTokenType,
      selectedRiskLevel,
      totalOpportunities: filteredOpportunitiesByTokenType?.length || 0
    })

    // Add detailed debugging for token symbols
    if (filteredOpportunitiesByTokenType?.length) {
      console.log('🔍 Available token symbols in API response:',
        Array.from(new Set(filteredOpportunitiesByTokenType.map((item: any) => item.token.symbol.toUpperCase())))
      )

      // Log a few sample opportunities for debugging
      console.log('📊 Sample opportunities (first 3):',
        filteredOpportunitiesByTokenType.slice(0, 3).map((item: any) => ({
          symbol: item.token.symbol,
          platformName: item.platform.platform_name,
          borrowRate: item.platform.apy.current,
          liquidity: item.platform.liquidity,
          hasCollateral: item.platform.collateral_tokens?.length > 0
        }))
      )

      // Check specifically for selected token type
      const matchingTokenOpportunities = filteredOpportunitiesByTokenType.filter((item: any) =>
        isTokenMatch(item.token.symbol, selectedTokenType)
      )
      console.log(`🎯 Found ${matchingTokenOpportunities.length} opportunities for ${selectedTokenType}`)
    }

    if (!filteredOpportunitiesByTokenType?.length || !selectedRiskLevel) {
      return []
    }

    // Filter opportunities first by token type and risk level
    const filteredOpportunities = filteredOpportunitiesByTokenType.filter((item: any) => {
      const isSelectedToken = isTokenMatch(item.token.symbol, selectedTokenType)
      const hasBorrowRate = Number(item.platform.apy.current) > 0.1
      const hasLiquidity = Number(item.platform.liquidity) > 0
      const liquidityUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const hasMeaningfulLiquidity = liquidityUSD > 10000

      // Calculate risk level for this opportunity
      const totalLiquidity = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const utilization = Number(item.platform.utilization_rate) || 0
      const platformName = item.platform.platform_name?.split('-')[0] || ''
      const borrowRate = Math.abs(Number(item.platform.apy.current))
      const opportunityRisk = calculateBorrowRiskLevel(utilization, totalLiquidity, platformName, borrowRate)

      // Only include opportunities that match the selected risk level
      const matchesRiskLevel = opportunityRisk === selectedRiskLevel

      // Exclude risky Morpho Markets (non-vaults) and Euler markets for borrowing
      const platformNameLower = item.platform.platform_name?.split('-')[0]?.toLowerCase()
      const isMorpho = platformNameLower === PlatformType.MORPHO
      const isEuler = platformNameLower === PlatformType.EULER
      const isCompound = platformNameLower === PlatformType.COMPOUND
      const isVault = item.platform.isVault
      const excludeRiskyMorphoMarkets = true
      const excludeEulerMarkets = true 
      const excludeCompoundMarkets = true
      const shouldExcludeMorphoMarkets = excludeRiskyMorphoMarkets && isMorpho && !isVault
      const shouldExcludeEulerMarkets = excludeEulerMarkets && isEuler
      const shouldExcludeCompoundMarkets = excludeCompoundMarkets && isCompound
      // Add detailed logging for filtering decisions
      // if (isSelectedToken) {
      //   console.log(`🔍 Filtering ${item.token.symbol} opportunity:`, {
      //     isSelectedToken,
      //     hasBorrowRate: `${hasBorrowRate} (rate: ${item.platform.apy.current})`,
      //     hasLiquidity: `${hasLiquidity} (liquidity: ${item.platform.liquidity})`,
      //     hasMeaningfulLiquidity: `${hasMeaningfulLiquidity} (USD: ${liquidityUSD})`,
      //     calculatedRisk: opportunityRisk,
      //     selectedRisk: selectedRiskLevel,
      //     matchesRiskLevel,
      //     platformName,
      //     shouldExcludeMorphoMarkets: shouldExcludeMorphoMarkets ? `excluded (isMorpho: ${isMorpho}, isVault: ${isVault})` : 'included',
      //     shouldExcludeEulerMarkets: shouldExcludeEulerMarkets ? `excluded (isEuler: ${isEuler})` : 'included',
      //     shouldExcludeCompoundMarkets: shouldExcludeCompoundMarkets ? `excluded (isCompound: ${isCompound})` : 'included'
      //   })
      // }

      return isSelectedToken && hasBorrowRate && hasLiquidity && hasMeaningfulLiquidity && matchesRiskLevel && !shouldExcludeMorphoMarkets && !shouldExcludeEulerMarkets && !shouldExcludeCompoundMarkets
    })

    console.log('🎯 Filtered opportunities by risk level:', {
      selectedRiskLevel,
      filteredCount: filteredOpportunities.length,
      originalCount: filteredOpportunitiesByTokenType.length
    })

    // Extract and group collateral tokens
    const collateralMap = new Map<string, {
      address: string,
      symbol: string,
      name: string,
      logo: string,
      marketCount: number,
      platforms: Set<string>
    }>()

    filteredOpportunities.forEach((item: any) => {
      const collateralTokensArray = item.platform.collateral_tokens || []
      const chainId = item.chain_id

      collateralTokensArray.forEach((tokenAddress: string) => {
        // Skip null/undefined/empty token addresses
        if (!tokenAddress || typeof tokenAddress !== 'string') return

        // Lookup actual token data
        const tokenData = allTokensData[chainId]?.find(
          (asset: any) => asset?.address?.toLowerCase() === tokenAddress.toLowerCase()
        )

        // Skip if we can't find token data
        if (!tokenData?.symbol) return

        // Use token symbol as key for grouping (since same token can exist on different chains)
        const tokenKey = tokenData.symbol.toUpperCase()
        const existing = collateralMap.get(tokenKey)

        if (existing) {
          existing.marketCount += 1
          existing.platforms.add(item.platform.platform_name?.split('-')[0] || '')
        } else {
          collateralMap.set(tokenKey, {
            address: tokenAddress, // Store one of the addresses (for reference)
            symbol: tokenData.symbol || tokenKey,
            name: tokenData.name || tokenData.symbol,
            logo: tokenData.logo || '',
            marketCount: 1,
            platforms: new Set([item.platform.platform_name?.split('-')[0] || ''])
          })
        }
      })
    })

    // Convert to array and calculate risk levels
    const collateralTokens = Array.from(collateralMap.entries()).map(([tokenKey, data]: any) => {
      // Since we're filtering opportunities by selected risk level,
      // the collateral token risk should always match what the user selected
      const riskLevel: 'Low' | 'Medium' | 'High' = selectedRiskLevel

      return {
        address: data.address,
        symbol: data.symbol,
        name: data.name,
        logo: data.logo,
        marketCount: data.marketCount,
        riskLevel,
        color: getRiskColor(riskLevel),
        bgColor: getRiskBgColor(riskLevel)
      }
    }).sort((a, b) => b.marketCount - a.marketCount) // Sort by market count desc

    console.log('🏷️ Final collateral tokens for risk level', selectedRiskLevel, ':',
      collateralTokens.map(c => ({ symbol: c.symbol, marketCount: c.marketCount, riskLevel: c.riskLevel }))
    )

    return collateralTokens
  }, [filteredOpportunitiesByTokenType, selectedRiskLevel, selectedTokenType, allTokensData])

  // Validate and potentially clear collateral selection when risk level changes
  useEffect(() => {
    if (selectedRiskLevel && selectedCollateralToken && collateralTokens.length > 0) {
      // Check if the currently selected collateral is still available for this risk level
      const isCollateralStillValid = collateralTokens.some(
        token => token.symbol.toUpperCase() === selectedCollateralToken
      )

      if (!isCollateralStillValid) {
        console.log(`🔄 Clearing collateral ${selectedCollateralToken} as it's no longer available for ${selectedRiskLevel} risk`)
        setSelectedCollateralToken(null)
        setSelectedAsset(null)
        clearSelectedAsset()
      }
    }
  }, [selectedRiskLevel, selectedCollateralToken, collateralTokens, clearSelectedAsset])

  // Process opportunities data and filter by selected risk level and collateral
  const assets: BorrowAsset[] = useMemo(() => {
    console.log('🎯 Processing opportunities data:', {
      dataLength: filteredOpportunitiesByTokenType?.length || 0,
      selectedTokenType,
      selectedRiskLevel,
      selectedCollateralToken,
      hasData: !!filteredOpportunitiesByTokenType?.length
    })

    if (!filteredOpportunitiesByTokenType?.length || !selectedRiskLevel || !selectedCollateralToken) {
      console.log('❌ No data or filters not selected')
      return []
    }

    // Filter for the selected token type, risk level, and collateral
    const filteredOpportunities = filteredOpportunitiesByTokenType.filter((item: any) => {
      const isSelectedToken = isTokenMatch(item.token.symbol, selectedTokenType)
      const hasBorrowRate = Number(item.platform.apy.current) > 0.1
      const hasLiquidity = Number(item.platform.liquidity) > 0
      const liquidityUSD = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const hasMeaningfulLiquidity = liquidityUSD > 10000

      // Check if this opportunity supports the selected collateral token
      const collateralTokensArray = item.platform.collateral_tokens || []
      const chainId = item.chain_id
      const supportsSelectedCollateral = collateralTokensArray.some((tokenAddress: string) => {
        // Skip null/undefined/empty token addresses
        if (!tokenAddress || typeof tokenAddress !== 'string') return false

        // Lookup actual token data
        const tokenData = allTokensData[chainId]?.find(
          (asset: any) => asset?.address?.toLowerCase() === tokenAddress.toLowerCase()
        )

        // Check if this token symbol matches the selected collateral
        return tokenData?.symbol?.toUpperCase() === selectedCollateralToken
      })

      // Exclude risky Morpho Markets (non-vaults) and Euler markets for borrowing
      const platformName = item.platform.platform_name?.split('-')[0]?.toLowerCase()
      const isMorpho = platformName === PlatformType.MORPHO
      const isEuler = platformName === PlatformType.EULER
      const isVault = item.platform.isVault
      const excludeRiskyMorphoMarkets = true
      const excludeEulerMarkets = true
      const shouldExcludeMorphoMarkets = excludeRiskyMorphoMarkets && isMorpho && !isVault
      const shouldExcludeEulerMarkets = excludeEulerMarkets && isEuler

      const shouldInclude = isSelectedToken && hasBorrowRate && hasLiquidity && hasMeaningfulLiquidity && supportsSelectedCollateral && !shouldExcludeMorphoMarkets && !shouldExcludeEulerMarkets

      if (isSelectedToken) {
        console.log('🔍 Filtering item:', {
          symbol: item.token.symbol,
          isSelectedToken,
          hasBorrowRate,
          hasLiquidity,
          hasMeaningfulLiquidity,
          supportsSelectedCollateral,
          shouldExcludeMorphoMarkets,
          shouldExcludeEulerMarkets,
          shouldInclude,
          borrowRate: item.platform.apy.current,
          liquidity: item.platform.liquidity,
          liquidityUSD,
          platformName,
          collateralTokens: collateralTokensArray.filter((addr: string) => addr && typeof addr === 'string').map((addr: string) => {
            const tokenData = allTokensData[item.chain_id]?.find(
              (asset: any) => asset?.address?.toLowerCase() === addr.toLowerCase()
            )
            return tokenData?.symbol || `${addr.slice(0, 6)}...${addr.slice(-4)}`
          })
        })
      }

      return shouldInclude
    })

    console.log('🎯 Filtered opportunities:', {
      originalCount: filteredOpportunitiesByTokenType.length,
      filteredCount: filteredOpportunities.length,
      selectedTokenType,
      tokens: filteredOpportunities.map((item: any) => item.token.symbol)
    })

    // Process and filter by risk level
    const processedAssets = filteredOpportunities.map((item: any) => {
      const totalLiquidity = Number(item.platform.liquidity) * Number(item.token.price_usd)
      const totalBorrows = Number(item.platform.borrows) * Number(item.token.price_usd)
      const availableLiquidity = totalLiquidity - totalBorrows
      const utilization = Number(item.platform.utilization_rate) || 0
      const platformName = item.platform.platform_name?.split('-')[0] || ''
      const borrowRate = Math.abs(Number(item.platform.apy.current))

      const risk = calculateBorrowRiskLevel(utilization, totalLiquidity, platformName, borrowRate)

      return {
        symbol: item.token.symbol,
        name: item.token.name,
        logo: item.token.logo,
        borrowRate: `${borrowRate.toFixed(2)}%`,
        borrowRateNumeric: borrowRate,
        maxLtv: `${((item.platform.max_ltv || 0.75) * 100).toFixed(0)}%`,
        risk,
        color: getRiskColor(risk),
        bgColor: getRiskBgColor(risk),
        popular: ['USDC', 'USDT', 'DAI'].includes(item.token.symbol.toUpperCase()),
        utilization,
        liquidity: totalLiquidity,
        availableLiquidity,
        tokenAddress: item.token.address,
        chainId: item.chain_id.toString(),
        protocolIdentifier: item.platform.protocol_identifier,
        platformName: item.platform.platform_name
      }
    })

    // Sort by platform reliability/risk based on user's risk preference
    const getPlatformRiskScore = (platformName: string): number => {
      const lowRiskPlatforms = ['aave', 'superlend']
      const mediumRiskPlatforms = ['compound', 'euler']
      const highRiskPlatforms = ['morpho', 'fluid']

      const platform = platformName.toLowerCase()

      if (lowRiskPlatforms.some(p => platform.includes(p))) return 1
      if (mediumRiskPlatforms.some(p => platform.includes(p))) return 2
      if (highRiskPlatforms.some(p => platform.includes(p))) return 3
      return 2 // Default to medium risk
    }

    const riskFilteredAssets = processedAssets
      .filter((asset: any) => asset.risk === selectedRiskLevel)
      .sort((a: any, b: any) => {
        const aRiskScore = getPlatformRiskScore(a.platformName)
        const bRiskScore = getPlatformRiskScore(b.platformName)

        // Sort by platform risk score first (lower is better), then by borrow rate
        if (aRiskScore !== bRiskScore) {
          return aRiskScore - bRiskScore
        }
        return a.borrowRateNumeric - b.borrowRateNumeric
      })
      .slice(0, 6) // Increased to 6 results to show more options

    console.log('🎯 Final filtered borrow assets:', riskFilteredAssets)
    return riskFilteredAssets
  }, [filteredOpportunitiesByTokenType, selectedRiskLevel, selectedTokenType, selectedCollateralToken, allTokensData])

  const handleAssetSelect = (asset: BorrowAsset) => {
    console.log('💰 Borrow asset selected:', asset.symbol, asset.protocolIdentifier)
    const uniqueAssetId = `${asset.symbol}-${asset.protocolIdentifier}`
    setSelectedAsset(uniqueAssetId)

    // Store in onboarding context for final step
    const assetToStore = {
      tokenAddress: asset.tokenAddress,
      tokenSymbol: asset.symbol,
      chainId: asset.chainId,
      protocolIdentifier: asset.protocolIdentifier,
      positionType: 'borrow' as const
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
      name: 'Wrapped Ether',
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
        description: 'Established protocols with competitive rates',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
        tooltipContent: (
          <div className="space-y-3">
            <h4 className="font-semibold text-green-800 text-sm">Low Risk Borrowing Characteristics</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Borrow rates below 8%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Utilization rates below 80%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Liquidity above $1M</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Established platforms (Aave, Superlend)</span>
              </li>
            </ul>
          </div>
        )
      },
      {
        level: 'Medium',
        title: 'Medium Risk',
        description: 'Moderate rates with balanced exposure',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
        tooltipContent: (
          <div className="space-y-3">
            <h4 className="font-semibold text-yellow-800 text-sm">Medium Risk Borrowing Characteristics</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Borrow rates 8-12%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Utilization rates 80-90%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Liquidity $100K-$1M</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Medium risk protocols (Compound, Euler)</span>
              </li>
            </ul>
          </div>
        )
      },
      {
        level: 'High',
        title: 'High Risk',
        description: 'Higher rates with increased exposure to risk',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
        tooltipContent: (
          <div className="space-y-3">
            <h4 className="font-semibold text-red-800 text-sm">High Risk Borrowing Characteristics</h4>
            <ul className="space-y-1.5 text-xs text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Borrow rates above 12%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Utilization rates above 90%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Liquidity below $100K</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>High risk protocols (Morpho, Fluid)</span>
              </li>
            </ul>
          </div>
        )
      },
    ]

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${selectedTokenType
            ? 'bg-primary border-primary text-white'
            : 'border-primary text-primary bg-white'
            }`}>
            {selectedTokenType ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className={`ml-2 text-sm font-medium ${selectedTokenType ? 'text-primary' : 'text-gray-500'}`}>
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
          <span className={`ml-2 text-sm font-medium ${selectedRiskLevel ? 'text-primary' : selectedTokenType ? 'text-gray-700' : 'text-gray-400'
            }`}>
            Risk Level
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        {/* Step 3 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${selectedCollateralToken
            ? 'bg-primary border-primary text-white'
            : shouldFetchData
              ? 'border-primary text-primary bg-white'
              : 'border-gray-300 text-gray-400 bg-gray-50'
            }`}>
            {selectedCollateralToken ? <Check className="w-4 h-4" /> : '3'}
          </div>
          <span className={`ml-2 text-sm font-medium ${selectedCollateralToken ? 'text-primary' : shouldFetchData ? 'text-gray-700' : 'text-gray-400'
            }`}>
            Collateral Selection
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400" />

        {/* Step 4 */}
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${selectedAsset
            ? 'bg-primary border-primary text-white'
            : selectedCollateralToken
              ? 'border-primary text-primary bg-white'
              : 'border-gray-300 text-gray-400 bg-gray-50'
            }`}>
            {selectedAsset ? <Check className="w-4 h-4" /> : '4'}
          </div>
          <span className={`ml-2 text-sm font-medium ${selectedAsset ? 'text-primary' : selectedCollateralToken ? 'text-gray-700' : 'text-gray-400'
            }`}>
            Final Selection
          </span>
        </div>
      </div>
    </div>
  )

  // Helper function to get collateral display name
  const getCollateralDisplayName = (): string => {
    if (!selectedCollateralToken) return ''
    const collateral = collateralTokens.find(c => c.symbol.toUpperCase() === selectedCollateralToken)
    return collateral?.symbol || `${selectedCollateralToken.slice(0, 6)}...${selectedCollateralToken.slice(-4)}`
  }

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
          Select Token for Borrowing
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
          Follow the 4 steps below to find the perfect borrowing opportunity for you.
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        {/* Step 3: Collateral Selection */}
        <motion.div
          id="collateral-selection-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: selectedTokenType ? 1 : 0.5,
            y: 0
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`border-2 rounded-2xl p-6 transition-all duration-300 ${selectedCollateralToken ? 'border-green-200 bg-green-50/50'
            : selectedTokenType ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50'
            }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedCollateralToken ? 'bg-primary border-primary text-white'
              : selectedTokenType ? 'border-primary text-primary'
                : 'border-gray-300 text-gray-400'
              }`}>
              {selectedCollateralToken ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <h3 className={`text-lg font-semibold ${selectedTokenType ? 'text-foreground' : 'text-gray-400'}`}>
              Select Collateral Token
            </h3>
            {shouldFetchData && isLoadingBorrowOpportunitiesData && (
              <div className="text-blue-500 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs text-blue-600 font-medium">Fetching data...</span>
              </div>
            )}
            {shouldFetchData && !isLoadingBorrowOpportunitiesData && !isErrorBorrowOpportunitiesData && (
              <div className="text-green-500 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs text-green-600 font-medium">Data fetched</span>
              </div>
            )}
            {shouldFetchData && !isLoadingBorrowOpportunitiesData && isErrorBorrowOpportunitiesData && (
              <div className="text-red-500 flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs text-red-600 font-medium">Failed to fetch data</span>
              </div>
            )}
          </div>

          {!shouldFetchData && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select token type and risk level first</p>
              <p className="text-sm text-gray-400 mt-1">Choose a token type and risk level above to see collateral options</p>
            </div>
          )}

          {shouldFetchData && isLoadingBorrowOpportunitiesData && (
            <LoadingSectionSkeleton className="h-[200px]" />
          )}

          {/* {shouldFetchData && !isLoading && isError && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-500 font-medium">Failed to load collateral tokens</p>
              <p className="text-sm text-gray-400 mt-1">Check your connection and try again</p>
              {!isRefreshButtonHidden ? (
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
              ) : (
                <div className="mt-4 text-green-600 flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Refreshed!</span>
                </div>
              )}
            </div>
          )} */}

          {shouldFetchData && !isLoadingBorrowOpportunitiesData && !isErrorBorrowOpportunitiesData && collateralTokens.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No collateral tokens found for {selectedRiskLevel?.toLowerCase()} risk {selectedTokenType} borrowing</p>
              <p className="text-sm text-gray-400 mt-1">
                {filteredOpportunitiesByTokenType?.length > 0 ? (
                  <>Try selecting a different risk level or consider these available tokens: {' '}
                    <span className="font-mono text-xs">
                      {Array.from(new Set(filteredOpportunitiesByTokenType.map((item: any) => item.token.symbol.toUpperCase()))).slice(0, 5).join(', ')}
                    </span></>
                ) : (
                  'Try selecting a different risk level or token type'
                )}
              </p>
              {/* {!isRefreshButtonHidden ? (
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
              ) : (
                <div className="mt-4 text-green-600 flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Refreshed!</span>
                </div>
              )} */}
            </div>
          )}

          {shouldFetchData && !isLoadingBorrowOpportunitiesData && !isErrorBorrowOpportunitiesData && collateralTokens.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Found {collateralTokens.length} collateral options for {selectedRiskLevel?.toLowerCase()} risk {selectedTokenType} borrowing
                  {/* {lastRefetch && (
                    <span className="text-xs text-gray-500 ml-2">
                      • Last updated: {lastRefetch.toLocaleTimeString()}
                    </span>
                  )} */}
                </p>
                {/* {!isRefreshButtonHidden && (
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                )} */}
                {/* {isRefreshButtonHidden && (
                  <div className="text-xs text-green-600 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Refreshed!</span>
                  </div>
                )} */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collateralTokens.slice(0, 3).map((collateral, index) => {
                  const isSelected = selectedCollateralToken === collateral.symbol.toUpperCase()
                  return (
                    <motion.button
                      key={collateral.symbol}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCollateralToken(collateral.symbol.toUpperCase())}
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
                            {collateral.logo ? (
                              <img
                                src={collateral.logo}
                                alt={collateral.symbol}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-700">
                                {collateral.symbol.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground">{collateral.symbol}</h4>
                            <p className="text-xs text-gray-500">{collateral.name}</p>
                          </div>
                        </div>

                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${collateral.bgColor} ${collateral.color} border`}>
                          {collateral.riskLevel}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Markets</span>
                          <span className="text-lg font-bold text-orange-700">{collateral.marketCount}</span>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>

        {/* Step 4: Final Market Selection */}
        <motion.div
          id="market-selection-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: selectedCollateralToken ? 1 : 0.5,
            y: 0
          }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`border-2 rounded-2xl p-6 transition-all duration-300 ${selectedAsset ? 'border-green-200 bg-green-50/50'
            : selectedCollateralToken ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50'
            }`}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${selectedAsset ? 'bg-primary border-primary text-white'
              : selectedCollateralToken ? 'border-primary text-primary'
                : 'border-gray-300 text-gray-400'
              }`}>
              {selectedAsset ? <Check className="w-4 h-4" /> : '4'}
            </div>
            <h3 className={`text-lg font-semibold ${selectedCollateralToken ? 'text-foreground' : 'text-gray-400'}`}>
              Select Your Market
            </h3>
          </div>

          {!selectedCollateralToken && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select a collateral token first</p>
              <p className="text-sm text-gray-400 mt-1">Choose a collateral token above to see available markets</p>
            </div>
          )}

          {selectedCollateralToken && isLoadingBorrowOpportunitiesData && (
            <LoadingSectionSkeleton className="h-[200px]" />
          )}

          {selectedCollateralToken && !isLoadingBorrowOpportunitiesData && isErrorBorrowOpportunitiesData && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-500 font-medium">Failed to load borrowing opportunities</p>
              <p className="text-sm text-gray-400 mt-1">Please use the refresh button in the collateral section above</p>
            </div>
          )}

          {selectedCollateralToken && !isLoadingBorrowOpportunitiesData && !isErrorBorrowOpportunitiesData && assets.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No markets found for {selectedTokenType} borrowing with {getCollateralDisplayName()} collateral</p>
              <p className="text-sm text-gray-400 mt-1">
                {filteredOpportunitiesByTokenType?.filter((item: any) => isTokenMatch(item.token.symbol, selectedTokenType)).length > 0 ? (
                  <>This combination is not available. Try a different collateral token or risk level.</>
                ) : (
                  <>No {selectedTokenType} borrowing opportunities found. Available tokens: {' '}
                    <span className="font-mono text-xs">
                      {Array.from(new Set(filteredOpportunitiesByTokenType?.map((item: any) => item.token.symbol.toUpperCase()) || [])).slice(0, 5).join(', ')}
                    </span></>
                )}
              </p>
              <div className="text-xs text-gray-400 mt-3">
                💡 Try using the refresh button in the collateral section above to get fresh data
              </div>
            </div>
          )}

          {selectedCollateralToken && !isLoadingBorrowOpportunitiesData && !isErrorBorrowOpportunitiesData && assets.length > 0 && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Found {assets.length} market{assets.length > 1 ? 's' : ''} for {selectedTokenType} borrowing with {getCollateralDisplayName()} collateral
                {/* {lastRefetch && (
                  <span className="text-xs text-gray-500 ml-2">
                    • Last updated: {lastRefetch.toLocaleTimeString()}
                  </span>
                )} */}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.slice(0, 3).map((asset, index) => {
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

                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Borrow Rate</span>
                          <span className="text-lg font-bold text-blue-700">{asset.borrowRate}</span>
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
      {selectedAsset && selectedCollateralToken && selectedRiskLevel && selectedTokenType && (
        <motion.div
          id="selection-summary-section"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-6 text-center"
        >
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <p className="text-sm text-primary font-medium">
              Perfect! You&apos;ve selected {selectedTokenType} borrowing with {getCollateralDisplayName()} collateral at {selectedRiskLevel?.toLowerCase()} risk. Click &quot;Next&quot; to proceed.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
} 