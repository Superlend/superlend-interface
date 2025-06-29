import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, CreditCard, GraduationCap, ArrowRight, Sparkles, Star, Zap, Coins, DollarSign, BookOpen, Info, Shield, Lock, CircleHelp } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import type { OnboardingPath } from '@/hooks/useOnboarding'
import { BodyText, HeadingText } from '@/components/ui/typography'
import InfoTooltip from '@/components/tooltips/InfoTooltip'

export const ChoosePathStep: React.FC = () => {
  const { selectedPath, setPath } = useOnboardingContext()

  const handlePathSelect = (path: OnboardingPath, pathTitle: string) => {
    // console.log('🎮 Path selected:', path, pathTitle)
    setPath(path)

    // Auto-scroll to the respective flow section when selected
    if (path === 'earn') {
      setTimeout(() => {
        const earnFlowSection = document.getElementById('earn-flow-section')
        if (earnFlowSection) {
          earnFlowSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 300)
    } else if (path === 'borrow') {
      setTimeout(() => {
        const borrowFlowSection = document.getElementById('borrow-flow-section')
        if (borrowFlowSection) {
          borrowFlowSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 300)
    }
  }

  const handleStartLearningPath = () => {
    // console.log('🎓 Starting Learning Path from Earn Flow')
    setPath('learn')
    // Note: We don't setStep here as the navigation is handled by the onboarding dialog
  }

  const paths = [
    {
      path: 'earn' as OnboardingPath,
      title: 'Earn on Crypto',
      description: 'Maximize yields on your digital assets through DeFi protocols. Start earning passive income today!',
      icon: <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10" />,
      theme: {
        gradient: 'bg-primary/5',
        borderColor: 'border-primary',
        glowColor: 'shadow-primary/20',
        iconBg: 'bg-primary',
        textColor: 'text-primary',
        bgPattern: 'bg-primary/3',
        hoverGlow: 'shadow-primary/30'
      }
    },
    {
      path: 'borrow' as OnboardingPath,
      title: 'Borrow Crypto',
      description: "Access liquidity while keeping your assets. Unlock your crypto's potential without selling!",
      icon: <CreditCard className="w-8 h-8 sm:w-10 sm:h-10" />,
      theme: {
        gradient: 'bg-primary/4',
        borderColor: 'border-primary/80',
        glowColor: 'shadow-primary/20',
        iconBg: 'bg-primary',
        textColor: 'text-primary/80',
        bgPattern: 'bg-primary/2',
        hoverGlow: 'shadow-primary/30'
      }
    },
    {
      path: 'learn' as OnboardingPath,
      title: 'Learn about DeFi',
      description: 'Master decentralized finance from basics to advanced. Become a DeFi expert step by step!',
      icon: <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />,
      theme: {
        gradient: 'bg-primary/3',
        borderColor: 'border-primary/60',
        glowColor: 'shadow-primary/15',
        iconBg: 'bg-primary/80',
        textColor: 'text-primary/70',
        bgPattern: 'bg-primary/2',
        hoverGlow: 'shadow-primary/25'
      }
    },
  ]

  const earnSteps = [
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Select Your Assets",
      description: "Choose from USDC, ETH, BTC and other supported cryptocurrencies"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Choose Yield Strategy",
      description: "Compare APYs across different lending protocols and filter from the best options"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Start Earning",
      description: "Deposit your assets and watch your yield grow automatically"
    }
  ]

  const borrowSteps = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Choose Loan Asset",
      description: "Select your preferred asset to borrow"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Provide Collateral",
      description: "Deposit crypto assets as collateral to secure your loan",
      tooltipContent: () => (
        <div className="flex flex-col gap-3 max-w-[250px]">
          <div className="flex items-center gap-1 pb-2 border-b border-gray-100">
            <Shield className="w-4 h-4 text-primary" />
            <BodyText level="body1" className="font-semibold text-foreground">Why Provide Collateral?</BodyText>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <BodyText level="body2" className="text-gray-700 leading-relaxed">
                <span className="font-medium text-foreground">Secures your loan:</span> Protects lenders and enables competitive borrowing rates
              </BodyText>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <BodyText level="body2" className="text-gray-700 leading-relaxed">
                <span className="font-medium text-foreground">Smart contract protection:</span> Your assets are safely locked and returned when you repay
              </BodyText>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Access Liquidity",
      description: "Receive borrowed funds while your collateral earns yield"
    }
  ]

  // console.log('🎮 Current selectedPath:', selectedPath)

  return (
    <div className="h-full flex flex-col space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <HeadingText level="h2" weight="bold" className="text-2xl sm:text-3xl font-bold text-foreground">
          Choose Your DeFi Journey
        </HeadingText>
        <BodyText level="body1" weight="normal" className="text-base sm:text-lg text-foreground max-w-2xl mx-auto">
          Select the path that interests you the most. We&apos;ll customize your experience
          and show you exactly how Superlend can help you achieve your goals.
        </BodyText>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
        {paths.map((pathData, index) => {
          const isSelected = selectedPath === pathData.path
          const theme = pathData.theme

          return (
            <motion.div
              key={pathData.path}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.3 } }}
              className="relative group"
            >
              {/* Optimized glassmorphism card */}
              <div
                className={`
                  relative rounded-2xl p-8 transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[300px]
                  backdrop-blur-sm border transform-gpu
                  ${isSelected
                    ? `${theme.borderColor} bg-white/35 shadow-2xl border-2 ${theme.glowColor} shadow-lg ring-1 ring-white/25`
                    : `bg-white/25 ${theme.bgPattern} border-primary/50 shadow-xl hover:bg-white/35 hover:border-2 hover:border-primary hover:shadow-2xl hover:shadow-primary/30 hover:ring-2 hover:ring-white/20 hover:-translate-y-1`
                  }
                `}
                onClick={() => handlePathSelect(pathData.path, pathData.title)}
              >
                {/* Clean color overlay */}
                <div 
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                    isSelected 
                      ? `${theme.gradient} opacity-60` 
                      : `${theme.bgPattern} opacity-40 group-hover:opacity-50`
                  }`}
                />

                {/* Enhanced glass reflection */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-white/15 to-transparent transition-opacity duration-300 ${
                  isSelected ? 'opacity-80' : 'opacity-60 group-hover:opacity-75'
                }`} />
                
                {/* Subtle shimmer effect for static state */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-500 ${
                  isSelected ? 'opacity-0' : 'opacity-100 group-hover:opacity-0 animate-pulse'
                }`} />

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Optimized icon section */}
                  <div className="flex items-center justify-between mb-8">
                    <div
                      className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden
                        border shadow-lg transform-gpu
                        ${isSelected
                          ? `${theme.iconBg} border-white/40 shadow-xl transform scale-105`
                          : `bg-white/30 border-white/40 shadow-xl group-hover:border-white/50 group-hover:shadow-2xl group-hover:scale-110 group-hover:bg-primary group-hover:-translate-y-1`
                        }
                      `}
                    >
                      {/* Clean solid background */}
                      <div 
                        className={`absolute inset-0 ${theme.iconBg} transition-opacity duration-300 ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      />
                      
                      {/* Enhanced glass shine effect */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-white/20 to-transparent transition-opacity duration-300 ${
                        isSelected ? 'opacity-60' : 'opacity-50 group-hover:opacity-55'
                      }`} />
                      
                      {/* Subtle glow ring for static state */}
                      <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                        isSelected ? 'opacity-0' : `opacity-30 group-hover:opacity-0 ring-1 ring-${theme.textColor.replace('text-', '')}/20`
                      }`} />
                      
                      {React.cloneElement(pathData.icon as React.ReactElement, {
                        className: `w-10 h-10 transition-colors duration-300 relative z-10 ${
                          isSelected ? 'text-white' : `${theme.textColor} group-hover:text-white`
                        }`
                      })}
                    </div>


                  </div>

                  {/* Content section */}
                  <div className="space-y-6 flex-1 flex flex-col">
                    <h3 className={`
                      text-2xl sm:text-3xl font-bold transition-all duration-300 leading-tight
                      ${isSelected ? 'text-gray-900' : 'text-gray-800 group-hover:text-gray-900 group-hover:scale-[1.02]'}
                    `}>
                      {pathData.title}
                    </h3>

                    <p className={`text-base leading-relaxed flex-1 font-medium transition-all duration-300 ${
                      isSelected ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-700'
                    }`}>
                      {pathData.description}
                    </p>
                    
                    {/* Fixed height CTA area to prevent layout shift */}
                    <div className="mt-4 h-6 flex items-center">
                      {!isSelected ? (
                        <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center text-sm font-medium text-primary/70 group-hover:text-primary">
                            <span>Click to explore</span>
                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                          className="flex items-center gap-2 bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg border border-white/20"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          <span>SELECTED</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fixed progress indicator with proper containment */}
                {isSelected && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 h-1.5 mx-0.5 mb-0.5 rounded-b-xl overflow-hidden"
                  >
                    <div className={`w-full h-full ${theme.iconBg} rounded-b-xl`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-b-xl" />
                  </motion.div>
                )}


              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Earn Flow Section - Only shown when earn path is selected */}
      {selectedPath === 'earn' && (
        <motion.div
          id="earn-flow-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-12 border-t border-gray-200"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${paths.find(p => p.path === 'earn')?.theme.iconBg} rounded-full flex items-center justify-center mb-4 relative overflow-hidden border border-white/20 shadow-lg`}>
              {/* Glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
              <TrendingUp className="w-7 h-7 text-white relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How to Earn on Crypto
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Discover how Superlend helps you maximize your crypto yields through intelligent
              protocol aggregation and yield optimization strategies.
            </p>
          </motion.div>

          {/* Steps Flow */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {earnSteps.map((step, index) => {
                  const earnTheme = paths.find(p => p.path === 'earn')?.theme
                  return (
                    <motion.div
                      key={index}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                      className="relative"
                    >
                      <div className={`bg-gradient-to-br ${earnTheme?.gradient} backdrop-blur-sm rounded-xl p-6 border ${earnTheme?.borderColor} text-center hover:shadow-lg transition-all duration-300 h-full flex flex-col`}>
                        <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${earnTheme?.iconBg} rounded-full flex items-center justify-center mb-4 relative overflow-hidden border border-white/20 shadow-md`}>
                          {/* Glass shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent rounded-full" />
                          <div className="text-white relative z-10">
                            {step.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed flex-1">
                          {step.description}
                        </p>
                      </div>

                      {/* Improved Arrow between steps */}
                      {index < earnSteps.length - 1 && (
                        <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                          <div className={`bg-white rounded-full p-1 shadow-sm border ${earnTheme?.borderColor}`}>
                            <ArrowRight className={`w-4 h-4 ${earnTheme?.textColor}`} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Educational Tips */}
          {/* <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="space-y-6"
          >
            // Section Separator
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-gray-500 font-medium">Ready to Learn More?</span>
              </div>
            </div>

            // Quick Tips Row
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-900 text-sm mb-2">What is APY?</h4>
                <p className="text-xs text-blue-700">
                  Annual Percentage Yield - your yearly return including compound interest
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-green-50 border border-green-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-green-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900 text-sm mb-2">Start Safe</h4>
                <p className="text-xs text-green-700">
                  Begin with low-risk stablecoins to learn before exploring higher yields
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-purple-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-900 text-sm mb-2">Diversify</h4>
                <p className="text-xs text-purple-700">
                  Spread your funds across multiple assets and protocols to reduce risk
                </p>
              </motion.div>
            </div>

            // Enhanced Learn More Section
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-amber-300 transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-lg mb-2">Deep Dive into DeFi Strategies</h4>
                  <p className="text-amber-800 mb-4 leading-relaxed">
                    Want comprehensive understanding? Our Learn path covers everything from DeFi fundamentals
                    to advanced risk management strategies. Plus, explore our blog for the latest insights.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                      💡 DeFi Basics
                    </span>
                    <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                      📈 Earning Strategies
                    </span>
                    <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                      🛡️ Risk Management
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleStartLearningPath}
                      className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors duration-200 text-sm"
                    >
                      <span>Start Learning Path</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                    <a
                      href="https://blog.superlend.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 py-2 bg-white border-2 border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-amber-50 transition-colors duration-200 text-sm"
                    >
                      <span>Read Our Blog</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div> */}
        </motion.div>
      )}

      {/* Borrow Flow Section - Only shown when borrow path is selected */}
      {selectedPath === 'borrow' && (
        <motion.div
          id="borrow-flow-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-12 border-t border-gray-200"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${paths.find(p => p.path === 'borrow')?.theme.iconBg} rounded-full flex items-center justify-center mb-4 relative overflow-hidden border border-white/20 shadow-lg`}>
              {/* Glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
              <CreditCard className="w-7 h-7 text-white relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How Borrowing Works
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Access liquidity without selling your crypto assets. Superlend finds you
              the best borrowing rates across multiple DeFi protocols.
            </p>
          </motion.div>

          {/* Steps Flow */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {borrowSteps.map((step, index) => {
                  const borrowTheme = paths.find(p => p.path === 'borrow')?.theme
                  return (
                    <motion.div
                      key={index}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                      className="relative"
                    >
                      <div className={`bg-gradient-to-br ${borrowTheme?.gradient} backdrop-blur-sm rounded-xl p-6 border ${borrowTheme?.borderColor} text-center hover:shadow-lg transition-all duration-300 h-full flex flex-col`}>
                        <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${borrowTheme?.iconBg} rounded-full flex items-center justify-center mb-4 relative overflow-hidden border border-white/20 shadow-md`}>
                          {/* Glass shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent rounded-full" />
                          <div className="text-white relative z-10">
                            {step.icon}
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">
                          {step.title}
                          {index === 1 && step.tooltipContent && (
                            <InfoTooltip
                              label={<Info className={`w-4 h-4 ${borrowTheme?.textColor} ml-2 inline cursor-help transition-colors duration-200`} />}
                              content={step.tooltipContent()}
                              side="top"
                              className="max-w-[350px]"
                            />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed flex-1">
                          {step.description}
                        </p>
                      </div>

                      {/* Improved Arrow between steps */}
                      {index < borrowSteps.length - 1 && (
                        <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                          <div className={`bg-white rounded-full p-1 shadow-sm border ${borrowTheme?.borderColor}`}>
                            <ArrowRight className={`w-4 h-4 ${borrowTheme?.textColor}`} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Educational Tips */}
          {/* <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="space-y-6"
          >
            // Section Separator
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-gray-500 font-medium">Ready to Learn More?</span>
              </div>
            </div>

            // Quick Tips Row
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-900 text-sm mb-2">Collateral Ratio</h4>
                <p className="text-xs text-blue-700">
                  Keep your collateral ratio healthy to avoid liquidation risks
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-green-50 border border-green-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-green-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900 text-sm mb-2">Stay Safe</h4>
                <p className="text-xs text-green-700">
                  Start with stable assets and conservative borrowing ratios
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center hover:shadow-lg hover:border-purple-300 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-900 text-sm mb-2">Interest Rates</h4>
                <p className="text-xs text-purple-700">
                  Monitor and compare borrowing rates across different protocols
                </p>
              </motion.div>
            </div>

            // Enhanced Learn More Section
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-amber-300 transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-lg mb-2">Master DeFi Borrowing Strategies</h4>
                  <p className="text-amber-800 mb-4 leading-relaxed">
                    Want to understand borrowing deeply? Our Learn path covers collateral management,
                    liquidation risks, and advanced borrowing strategies. Explore our blog for expert insights.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                      🔒 Collateral Management
                    </span>
                    <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                      💳 Borrowing Strategies
                    </span>
                    <span className="inline-flex items-center px-3 py-2 bg-white/70 rounded-full text-sm font-medium text-amber-800 border border-amber-200">
                      ⚡ Risk Management
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleStartLearningPath}
                      className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors duration-200 text-sm"
                    >
                      <span>Start Learning Path</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                    <a
                      href="https://blog.superlend.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 py-2 bg-white border-2 border-amber-300 text-amber-800 rounded-lg font-medium hover:bg-amber-50 transition-colors duration-200 text-sm"
                    >
                      <span>Read Our Blog</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div> */}
        </motion.div>
      )}
    </div>
  )
} 