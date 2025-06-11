import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Star, Sparkles, ExternalLink as ExternalLinkIcon, RotateCcw } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import { useRouter } from 'next/navigation'
import useGetOpportunitiesData from '@/hooks/useGetOpportunitiesData'
import { TPositionType } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ExternalLink from '@/components/ExternalLink'

const ConfettiAnimation: React.FC = () => {
  const [windowDimensions, setWindowDimensions] = React.useState({ width: 0, height: 0 })
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight })
      
      const handleResize = () => {
        setWindowDimensions({ width: window.innerWidth, height: window.innerHeight })
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const confettiColors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 
    'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-orange-400'
  ]
  
  const confettiPieces = React.useMemo(() => {
    if (windowDimensions.width === 0) return []
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      x: Math.random() * windowDimensions.width,
      endY: windowDimensions.height + 100,
      size: Math.random() > 0.5 ? 'w-3 h-3' : 'w-2 h-4', // Mix of squares and rectangles
      shape: Math.random() > 0.5 ? 'triangle' : 'rectangle'
    }))
  }, [windowDimensions.width, windowDimensions.height])

  if (windowDimensions.width === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -100, x: piece.x, opacity: 1, rotate: 0 }}
          animate={{ 
            y: piece.endY, 
            x: piece.x + Math.random() * 100 - 50,
            opacity: 0,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: "easeOut"
          }}
          className={`absolute ${piece.size} ${piece.color}`}
          style={{
            clipPath: piece.shape === 'triangle' 
              ? 'polygon(50% 0%, 0% 100%, 100% 100%)' // Triangle
              : 'none' // Rectangle
          }}
        />
      ))}
    </div>
  )
}

export const FinalStep: React.FC = () => {
  const { selectedPath, selectedAsset, closeOnboarding, setPath, setStep } = useOnboardingContext()
  const router = useRouter()
  const [showConfetti, setShowConfetti] = React.useState(false)
  
  // Get opportunities data as fallback if no asset is selected
  const positionType = selectedPath === 'earn' ? 'lend' : selectedPath === 'borrow' ? 'borrow' : 'lend'
  const { data: opportunitiesData, isLoading } = useGetOpportunitiesData({
    type: positionType as TPositionType,
  })

  // Trigger confetti animation on mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowConfetti(true)
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Use selected asset or find fallback
  const getRedirectAsset = () => {
    // If user has selected an asset, use that
    if (selectedAsset) {
      return selectedAsset
    }

    // Fallback: find a suitable asset from opportunities data
    if (!opportunitiesData || opportunitiesData.length === 0) return null

    // Filter for Superlend platform and sort by APY
    const superlendOpportunities = opportunitiesData
      .filter(item => item.platform.platform_name?.toLowerCase().includes('superlend'))
      .sort((a, b) => Number(b.platform.apy.current) - Number(a.platform.apy.current))

    // If no Superlend opportunities, use the highest APY asset
    if (superlendOpportunities.length === 0) {
      const topAsset = opportunitiesData
        .sort((a, b) => Number(b.platform.apy.current) - Number(a.platform.apy.current))[0]

      return {
        tokenAddress: topAsset.token.address,
        tokenSymbol: topAsset.token.symbol,
        chainId: topAsset.chain_id,
        protocolIdentifier: topAsset.platform.protocol_identifier,
        positionType: positionType as 'lend' | 'borrow'
      }
    }

    const topSuperlendAsset = superlendOpportunities[0]
    return {
      tokenAddress: topSuperlendAsset.token.address,
      tokenSymbol: topSuperlendAsset.token.symbol,
      chainId: topSuperlendAsset.chain_id,
      protocolIdentifier: topSuperlendAsset.platform.protocol_identifier,
      positionType: positionType as 'lend' | 'borrow'
    }
  }

  const handleGetStarted = () => {
    console.log('🚀 Get Started clicked!')
    console.log('📋 Current state:', { selectedPath, selectedAsset, positionType })
    
    // Close the onboarding dialog first
    closeOnboarding()
    
    // Handle different paths appropriately
    if (selectedPath === 'learn') {
      console.log('📚 Learning path selected - redirecting to Superlend blog')
      // For learn path, redirect to educational content
      window.open('https://blog.superlend.xyz/', '_blank')
      return
    }
    
    // For earn/borrow paths, redirect to selected asset or fallback
    const asset = getRedirectAsset()
    console.log('🎯 Asset to redirect to:', asset)
    
    if (!asset) {
      console.log('❌ No asset found, redirecting to discover page')
      // Fallback to discover page instead of home
      router.push('/')
      return
    }

    const url = `/position-management?token=${asset.tokenAddress}&protocol_identifier=${asset.protocolIdentifier}&chain_id=${asset.chainId}&position_type=${asset.positionType}`
    console.log('🔗 Navigating to URL:', url)
    router.push(url)
  }

  const handleStartEarnPath = () => {
    console.log('💰 Starting Earn Path from Learn Final Step')
    setPath('earn')
    setStep('earn-flow')
  }

  const handleStartBorrowPath = () => {
    console.log('💳 Starting Borrow Path from Learn Final Step')
    setPath('borrow')
    setStep('borrow-flow')
  }

  const handleStartOver = () => {
    console.log('🔄 Starting over from beginning')
    // Reset to appropriate starting point based on current path
    if (selectedPath === 'learn') {
      setStep('choose-path')
    } else if (selectedPath === 'earn') {
      setStep('earn-assets')
    } else if (selectedPath === 'borrow') {
      setStep('borrow-assets')
    } else {
      setStep('choose-path')
    }
  }

  const getPathSpecificContent = () => {
    switch (selectedPath) {
      case 'earn':
        return {
          title: 'Ready to Start Earning!',
          description: 'You\'re all set to maximize your crypto yields with Superlend.',
          nextSteps: [
            'Connect your wallet to get started',
            'Make your first deposit and start earning',
            'Track your returns in real-time'
          ],
          cta: `Deposit ${selectedAsset?.tokenSymbol}`,
          color: 'accent-lightBlue',
          iconBg: 'from-blue-500 to-blue-600',
          iconColor: 'text-white'
        }
      case 'borrow':
        return {
          title: 'Ready to Access Liquidity!',
          description: 'You understand borrowing and are ready to leverage your assets.',
          nextSteps: [
            'Connect your wallet and deposit collateral',
            'Access instant liquidity',
            'Monitor your position health'
          ],
          cta: `Borrow against ${selectedAsset?.tokenSymbol}`,
          color: 'accent-lightGreen',
          iconBg: 'from-green-500 to-green-600',
          iconColor: 'text-white'
        }
      case 'learn':
        return {
          title: 'Your DeFi Journey Begins!',
          description: 'You\'ve gained valuable knowledge about decentralized finance and are ready to take action.',
          nextSteps: [
            'Start with small amounts ($10-$50) to practice safely',
            'Choose between earning yield or borrowing against assets',
            'Monitor your positions and learn from real experience'
          ],
          cta: 'Choose Your Path',
          color: 'accent-cream',
          iconBg: 'from-amber-500 to-orange-500',
          iconColor: 'text-white'
        }
      default:
        return {
          title: 'Welcome to Superlend!',
          description: 'You\'re ready to explore the world of DeFi.',
          nextSteps: [
            'Connect your wallet to get started',
            'Start with the basics',
            'Join our community'
          ],
          cta: 'Get Started',
          color: 'primary',
          iconBg: 'from-primary to-primary/80',
          iconColor: 'text-white'
        }
    }
  }

  const content = getPathSpecificContent()

  return (
    <div className="flex flex-col h-full overflow-x-hidden">
      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation />}
      
      <div className="flex flex-col text-center space-y-6 py-6 min-h-full max-w-full">
        {/* Celebration Animation */}
        {/* <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.8,
            ease: "backOut",
            delay: 0.2
          }}
          className="relative mx-auto w-fit"
        >
          <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br ${content.iconBg} rounded-full flex items-center justify-center shadow-lg shadow-black/20`}>
            <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${content.iconColor}`} />
          </div>

          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 hidden sm:block"
            style={{ zIndex: 10 }}
          >
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-400" />
          </motion.div>

          <motion.div
            animate={{
              rotate: -360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              delay: 1
            }}
            className="absolute -bottom-0 -left-1 sm:-bottom-1 sm:-left-2 hidden sm:block"
            style={{ zIndex: 10 }}
          >
            <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-400" />
          </motion.div>
        </motion.div> */}

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3 px-4"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            🎉 {content.title}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {content.description}
          </p>
          {selectedAsset && selectedPath !== 'learn' && (
            <p className="text-sm text-primary font-medium">
              You selected {selectedAsset.tokenSymbol} - great choice!
              {selectedPath === 'earn' && " Let's start earning yield on this stable token."}
              {selectedPath === 'borrow' && " Let's set up your borrowing position."}
            </p>
          )}
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-4xl mx-auto px-4"
        >
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground mb-4 sm:mb-6 text-center">
            What&apos;s Next?
          </h2>

          <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
            {content.nextSteps.map((step, index) => (
              <div key={index} className="relative">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-4 p-4 sm:p-6 border border-primary/20 hover:shadow-lg transition-all duration-300 h-full"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 lg:flex-col lg:space-x-0 lg:space-y-4 lg:text-center h-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 lg:flex lg:items-center lg:justify-center lg:min-h-[60px]">
                      <p className="text-sm sm:text-base font-medium text-gray-800 leading-relaxed">{step}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Arrow between steps - Only show on mobile/tablet, not desktop grid */}
                {index < content.nextSteps.length - 1 && (
                  <div className="flex justify-center py-2 sm:py-3 lg:hidden">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="px-4"
        >
          {selectedPath === 'learn' ? (
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Your DeFi Journey?</h3>
                <p className="text-gray-600 max-w-md mx-auto">Choose your path and begin building wealth with decentralized finance</p>
              </motion.div>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <motion.button
                  onClick={handleStartEarnPath}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 group relative bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 backdrop-blur-sm border border-emerald-200/50 text-emerald-700 hover:text-emerald-800 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">Start Earning</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                  <p className="text-emerald-600/80 text-sm mt-1">Generate passive income</p>
                </motion.button>
                
                <motion.button
                  onClick={handleStartBorrowPath}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 group relative bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 backdrop-blur-sm border border-blue-200/50 text-blue-700 hover:text-blue-800 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">Start Borrowing</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                  <p className="text-blue-600/80 text-sm mt-1">Access instant liquidity</p>
                </motion.button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-center"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a 
                    href="https://blog.superlend.xyz/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>Continue Learning</span>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleStartOver}
                    className="inline-flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 font-medium underline underline-offset-2 transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Start over</span>
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-4 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? 'Loading...' : content.cta}
              </button>
              <button
                onClick={handleStartOver}
                className="inline-flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 font-medium underline underline-offset-2 transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start over</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Community & Support */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="w-full max-w-xl mx-auto bg-gray-50 rounded-4 p-4 sm:p-6 border border-gray-200"
        >
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">
            Need Help? We&apos;re Here for You!
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-secondary-100 rounded-full flex-shrink-0" />
              <ExternalLink href="https://discord.com/invite/superlend">Discord Community</ExternalLink>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-secondary-100 rounded-full flex-shrink-0" />
              <ExternalLink href="https://blog.superlend.xyz/">Educational Content</ExternalLink>
            </div>
          </div>
        </motion.div>

        {/* Final Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="text-center space-y-2 px-4"
        >
          <p className="text-gray-600 text-xs sm:text-sm">
            Thanks for taking the time to learn about Superlend!
          </p>
          <p className="text-xs text-gray-500">
            You can always access this tour again from your settings.
          </p>
        </motion.div>
      </div>
    </div>
  )
} 