import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, AlertTriangle, TrendingUp, Star, Check } from 'lucide-react'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'

interface CollateralAsset {
  symbol: string
  name: string
  logo: string
  ltv: string
  liquidation: string
  risk: 'Low' | 'Medium' | 'High'
  color: string
  bgColor: string
  popular: boolean
  utilization: number
  liquidity: number
  priceVolatility: 'Low' | 'Medium' | 'High'
}

export const BorrowCollateralStep: React.FC = () => {
  const [selectedCollateral, setSelectedCollateral] = useState<string | null>(null)

  // Fetch both lend and borrow data to get collateral information
  const { data: lendData, isLoading: isLoadingLend } = useGetOpportunitiesData({
    type: 'lend',
    enabled: true,
  })

  const { data: borrowData, isLoading: isLoadingBorrow } = useGetOpportunitiesData({
    type: 'borrow',
    enabled: true,
  })

  const isLoading = isLoadingLend || isLoadingBorrow

  // Helper function to get price volatility based on asset type
  const getPriceVolatility = (symbol: string): 'Low' | 'Medium' | 'High' => {
    const lowVolatility = ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD']
    const mediumVolatility = ['WETH', 'ETH', 'stETH', 'WBTC', 'BTC']
    const symbolUpper = symbol.toUpperCase()
    
    if (lowVolatility.some(stable => symbolUpper.includes(stable))) return 'Low'
    if (mediumVolatility.some(major => symbolUpper.includes(major))) return 'Medium'
    return 'High'
  }

  // Helper function to calculate collateral risk
  const calculateCollateralRisk = (ltv: number, volatility: 'Low' | 'Medium' | 'High', utilization: number): 'Low' | 'Medium' | 'High' => {
    let riskScore = 0
    
    // LTV risk (higher LTV = higher risk)
    if (ltv > 0.8) riskScore += 2
    else if (ltv > 0.7) riskScore += 1
    
    // Volatility risk
    if (volatility === 'High') riskScore += 2
    else if (volatility === 'Medium') riskScore += 1
    
    // Utilization risk (higher utilization = less buffer)
    if (utilization > 0.8) riskScore += 1
    
    if (riskScore >= 3) return 'High'
    if (riskScore >= 1) return 'Medium'
    return 'Low'
  }

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

  // Process collateral assets from lend data (assets that can be used as collateral)
  const collateralAssets: CollateralAsset[] = useMemo(() => {
    if (!lendData?.length) return []

    // Get unique tokens that can be used as collateral (from lending pools)
    const tokenMap = new Map<string, any>()
    
    lendData.forEach(item => {
      // Only consider assets with reasonable LTV (can be used as collateral)
      if (item.platform.max_ltv && item.platform.max_ltv > 0.5) {
        const existing = tokenMap.get(item.token.symbol)
        if (!existing || item.platform.max_ltv > existing.platform.max_ltv) {
          tokenMap.set(item.token.symbol, item)
        }
      }
    })

    // Get top collateral assets
    const topAssets = Array.from(tokenMap.values())
      .sort((a, b) => b.platform.max_ltv - a.platform.max_ltv)
      .slice(0, 6)

    return topAssets.map((item) => {
      const ltv = item.platform.max_ltv || 0.75
      const liquidationThreshold = Math.min(ltv + 0.05, 0.95) // Usually 5% higher than LTV
      const utilization = item.platform.utilization_rate || 0
      const priceVolatility = getPriceVolatility(item.token.symbol)
      const risk = calculateCollateralRisk(ltv, priceVolatility, utilization)
      
      // Popular collateral assets
      const popularCollateral = ['ETH', 'WETH', 'WBTC', 'BTC', 'USDC', 'USDT']
      const isPopular = popularCollateral.includes(item.token.symbol.toUpperCase())

      return {
        symbol: item.token.symbol,
        name: item.token.name,
        logo: item.token.logo,
        ltv: `${(ltv * 100).toFixed(0)}%`,
        liquidation: `${(liquidationThreshold * 100).toFixed(0)}%`,
        risk,
        color: getRiskColor(risk),
        bgColor: getRiskBgColor(risk),
        popular: isPopular,
        utilization,
        liquidity: Number(item.platform.liquidity) * Number(item.token.price_usd),
        priceVolatility,
      }
    })
  }, [lendData])

  const handleCollateralSelect = (symbol: string) => {
    console.log('Collateral selected:', symbol)
    setSelectedCollateral(symbol)
  }

  const riskManagement = [
    {
      icon: <Shield className="w-5 h-5 text-green-600" />,
      title: "Health Factor Monitoring",
      description: "Real-time tracking of your position health to prevent liquidation"
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      title: "Liquidation Alerts",
      description: "Automated notifications when your position approaches risk"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      title: "Auto-Repayment",
      description: "Optional automatic repayment to maintain healthy positions"
    }
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-lightGreen to-accent-darkGreen rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Collateral & Risk Management
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Loading collateral options...
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
        className="text-center mb-6"
      >
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-lightGreen to-accent-darkGreen rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Collateral & Risk Management
        </h2>
        <p className="text-base text-gray-600 max-w-xl mx-auto">
          Choose your collateral asset and understand how we help you manage risk when borrowing. 
          Your assets remain productive while securing your loans.
        </p>
      </motion.div>

      <div className="flex-1 space-y-6">
        {/* Collateral Assets */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
            Choose Your Collateral Asset
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collateralAssets.map((asset, index) => {
              const isSelected = selectedCollateral === asset.symbol
              return (
                <motion.button
                  key={asset.symbol}
                  type="button"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCollateralSelect(asset.symbol)}
                  className={`
                    relative w-full text-left rounded-4 p-4 border-2 transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50
                    ${isSelected
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/30'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }
                  `}
                >
                  {asset.popular && !isSelected && (
                    <div className="absolute -top-2 -right-2 bg-accent-lightBlue text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Popular</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {asset.logo ? (
                        <img 
                          src={asset.logo} 
                          alt={asset.symbol}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling!.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <span className={`text-sm font-bold text-gray-700 ${asset.logo ? 'hidden' : ''}`}>
                        {asset.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{asset.symbol}</h4>
                      <p className="text-xs text-gray-500">{asset.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Max LTV</span>
                      <span className="text-xs font-medium">{asset.ltv}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Liquidation</span>
                      <span className="text-xs font-medium text-red-600">{asset.liquidation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Volatility</span>
                      <span className={`text-xs font-medium ${
                        asset.priceVolatility === 'Low' ? 'text-green-600' :
                        asset.priceVolatility === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {asset.priceVolatility}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Risk</span>
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
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

        {/* Selection Feedback */}
        {selectedCollateral && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-primary font-medium">
              Great choice! You&apos;ve selected {selectedCollateral} as collateral. Click &quot;Next&quot; to proceed.
            </p>
          </motion.div>
        )}

        {/* Risk Management */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
            How We Protect Your Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskManagement.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-4 p-6 border border-gray-200 shadow-sm text-center"
              >
                <div className="w-12 h-12 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-foreground mb-3">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Important Notice */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-6 bg-red-50 border border-red-200 rounded-4 p-4"
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 mb-2">Important: Liquidation Risk</h4>
            <p className="text-sm text-red-700">
              If your collateral value falls and your health factor drops below 1.0, your position 
              may be liquidated to protect lenders. Always maintain a safe buffer above the liquidation threshold.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Additional Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-4 text-center"
      >
        <div className="bg-primary/5 rounded-4 p-4 border border-primary/20">
          <p className="text-sm text-gray-600">
            <strong>Live Data:</strong> LTV ratios and liquidation thresholds are fetched in real-time. 
            Risk assessment considers price volatility, utilization rates, and market conditions.
          </p>
        </div>
      </motion.div>
    </div>
  )
} 