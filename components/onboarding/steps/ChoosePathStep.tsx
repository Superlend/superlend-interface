import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, CreditCard, GraduationCap, ArrowRight, Sparkles, Star, Zap, Coins, DollarSign, BookOpen, Info, Shield, Lock } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import type { OnboardingPath } from '@/hooks/useOnboarding'
import { BodyText, HeadingText } from '@/components/ui/typography'

export const ChoosePathStep: React.FC = () => {
  const { selectedPath, setPath } = useOnboardingContext()

  const handlePathSelect = (path: OnboardingPath, pathTitle: string) => {
    console.log('🎮 Path selected:', path, pathTitle)
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
    console.log('🎓 Starting Learning Path from Earn Flow')
    setPath('learn')
    // Note: We don't setStep here as the navigation is handled by the onboarding dialog
  }

  const paths = [
    {
      path: 'earn' as OnboardingPath,
      title: 'Earn on Crypto',
      description: 'Maximize yields on your digital assets through DeFi protocols. Start earning passive income today!',
      icon: <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-green-400/20 via-emerald-400/20 to-teal-400/20',
      hoverGradient: 'bg-gradient-to-br from-green-400/40 to-teal-400/40',
      accentColor: 'bg-gradient-to-br from-green-400 to-emerald-500',
      particleColor: 'bg-green-400',
    },
    {
      path: 'borrow' as OnboardingPath,
      title: 'Borrow Crypto',
      description: "Access liquidity while keeping your assets. Unlock your crypto's potential without selling!",
      icon: <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-indigo-400/20',
      hoverGradient: 'bg-gradient-to-br from-blue-400/40 to-indigo-400/40',
      accentColor: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      particleColor: 'bg-blue-400',
    },
    {
      path: 'learn' as OnboardingPath,
      title: 'Learn about DeFi',
      description: 'Master decentralized finance from basics to advanced. Become a DeFi expert step by step!',
      icon: <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-rose-400/20',
      hoverGradient: 'bg-gradient-to-br from-purple-400/40 to-rose-400/40',
      accentColor: 'bg-gradient-to-br from-purple-400 to-pink-500',
      particleColor: 'bg-purple-400',
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
      description: "Deposit crypto assets as collateral to secure your loan"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Access Liquidity",
      description: "Receive borrowed funds while your collateral earns yield"
    }
  ]

  console.log('🎮 Current selectedPath:', selectedPath)

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
          return (
            <motion.div
              key={pathData.path}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div
                className={`
                  relative rounded-lg p-6 sm:p-8 border-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full min-h-[360px]
                  ${isSelected
                    ? `border-primary ${pathData.gradient} shadow-2xl ring-4 ring-primary/20`
                    : `border-gray-200 ${pathData.gradient} bg-white/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-2xl group-hover:shadow-2xl hover:bg-white/70`
                  }
                `}
                onClick={() => handlePathSelect(pathData.path, pathData.title)}
              >
                {/* Enhanced hover glow effect */}
                <div className={`
                  absolute inset-0 rounded-lg transition-all duration-500 -z-10
                  ${isSelected
                    ? `opacity-100 ${pathData.hoverGradient} blur-xl`
                    : `opacity-0 group-hover:opacity-60 ${pathData.hoverGradient} blur-lg`
                  }
                `} />

                {/* Enhanced animated background particles for selected */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(isSelected ? 8 : 0)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1 h-1 ${pathData.accentColor} rounded-full opacity-30`}
                      animate={{
                        x: [0, 100, 0],
                        y: [0, -60, 0],
                        scale: [0, 1.5, 0],
                        opacity: [0, 0.4, 0],
                      }}
                      transition={{
                        duration: 3 + i * 0.3,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut"
                      }}
                      style={{
                        left: `${15 + i * 12}%`,
                        top: `${25 + i * 10}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Floating light particles for unselected cards on hover */}
                {!isSelected && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Constant subtle particles */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={`subtle-${i}`}
                        className={`absolute w-0.5 h-0.5 ${pathData.particleColor} rounded-full opacity-20`}
                        animate={{
                          x: [0, 60, 0],
                          y: [0, -30, 0],
                          scale: [0, 1, 0],
                          opacity: [0, 0.3, 0],
                        }}
                        transition={{
                          duration: 4 + i * 0.8,
                          repeat: Infinity,
                          delay: i * 1.2,
                          ease: "easeInOut"
                        }}
                        style={{
                          left: `${20 + i * 20}%`,
                          top: `${40 + i * 15}%`,
                        }}
                      />
                    ))}

                    {/* Enhanced hover particles */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`hover-${i}`}
                        className={`absolute w-1 h-1 ${pathData.particleColor} rounded-full opacity-0 group-hover:opacity-40`}
                        animate={{
                          x: [0, 120, 0],
                          y: [0, -80, 0],
                          scale: [0, 1.2, 0],
                          rotate: [0, 360, 720],
                        }}
                        transition={{
                          duration: 3.5 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.6,
                          ease: "easeInOut"
                        }}
                        style={{
                          left: `${10 + i * 15}%`,
                          top: `${30 + i * 12}%`,
                        }}
                      />
                    ))}

                    {/* Orbiting particles on hover */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={`orbit-${i}`}
                        className={`absolute w-1.5 h-1.5 ${pathData.particleColor} rounded-full opacity-0 group-hover:opacity-25`}
                        animate={{
                          rotate: [0, 360],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 8 + i * 2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 1.5
                        }}
                        style={{
                          left: `${50}%`,
                          top: `${50}%`,
                          transformOrigin: `${30 + i * 20}px ${20 + i * 15}px`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Magical floating elements for unselected cards */}
                {!isSelected && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    {/* Large floating orbs */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={`float-${i}`}
                        className={`absolute w-8 h-8 ${pathData.accentColor} rounded-full opacity-10`}
                        animate={{
                          y: [0, -25, 0],
                          scale: [0.6, 1.4, 0.6],
                          rotate: [0, 180, 360],
                          opacity: [0.05, 0.15, 0.05],
                        }}
                        transition={{
                          duration: 6 + i * 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 1.5
                        }}
                        style={{
                          left: `${20 + i * 30}%`,
                          top: `${15 + i * 35}%`,
                        }}
                      />
                    ))}

                    {/* Shimmer effect */}
                    <motion.div
                      className={`absolute w-full h-0.5 ${pathData.accentColor} opacity-20`}
                      animate={{
                        x: ['-100%', '100%'],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      style={{
                        top: '30%',
                        transform: 'rotate(45deg)',
                      }}
                    />

                    {/* Pulse rings */}
                    {[...Array(2)].map((_, i) => (
                      <motion.div
                        key={`pulse-${i}`}
                        className={`absolute w-16 h-16 border-2 ${pathData.particleColor.replace('bg-', 'border-')} rounded-full opacity-0`}
                        animate={{
                          scale: [0, 2],
                          opacity: [0.3, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: i * 1.5
                        }}
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Icon section */}
                  <div className="flex items-center justify-between mb-6">
                    <motion.div
                      className={`
                        w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center relative transition-all duration-300
                        ${isSelected
                          ? `${pathData.accentColor} shadow-lg`
                          : `bg-gradient-to-br from-gray-100/80 to-gray-200/50 shadow-sm group-hover:shadow-md`
                        }
                      `}
                      whileHover={{
                        rotate: isSelected ? 360 : 12,
                        scale: isSelected ? 1 : 1.05
                      }}
                      transition={{ duration: 0.6 }}
                      animate={!isSelected ? {
                        scale: [1, 1.02, 1],
                      } : {}}
                      style={!isSelected ? {
                        animationDuration: "3s",
                        animationIterationCount: "infinite"
                      } : {}}
                    >
                      {React.cloneElement(pathData.icon as React.ReactElement, {
                        className: `w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-gray-700 group-hover:text-primary'}`
                      })}

                      {/* Enhanced sparkles for selected */}
                      {isSelected && (
                        <motion.div
                          className="absolute -top-1 -right-1"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                        </motion.div>
                      )}

                      {/* Enhanced glow for unselected on hover */}
                      {!isSelected && (
                        <>
                          <motion.div
                            className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm`}
                            initial={{ scale: 0.8 }}
                            whileHover={{ scale: 1.3 }}
                            transition={{ duration: 0.3 }}
                          />
                          {/* Additional outer glow ring */}
                          <motion.div
                            className={`absolute inset-0 rounded-lg border-2 ${pathData.particleColor.replace('bg-', 'border-')} opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.4 }}
                            animate={{
                              scale: [1, 1.05, 1],
                            }}
                            style={{
                              animationDuration: "2s",
                              animationIterationCount: "infinite"
                            }}
                          />
                        </>
                      )}
                    </motion.div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                        className="flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold"
                      >
                        <Star className="w-3 h-3 fill-current" />
                        <span>SELECTED</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Content section */}
                  <div className="space-y-4 flex-1 flex flex-col">
                    <h3 className={`
                      text-xl sm:text-2xl font-bold transition-colors duration-300
                      ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'}
                    `}>
                      {pathData.title}
                    </h3>

                    <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1">
                      {pathData.description}
                    </p>

                    {/* Enhanced CTA button */}
                    <motion.div
                      className={`
                        flex items-center justify-between p-4 rounded-lg transition-all duration-300 mt-auto
                        ${isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-gray-50 group-hover:bg-primary/5 border border-gray-200 group-hover:border-primary/30'
                        }
                      `}
                      whileHover={{ x: 4, scale: 1.02 }}
                    >
                      <span className={`
                        text-sm font-semibold transition-colors duration-300
                        ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'}
                      `}>
                        {isSelected ? 'Selected!' : 'Get Started'}
                      </span>
                      <ArrowRight className={`
                        transition-all duration-300
                        ${isSelected ? 'text-primary translate-x-1' : 'text-gray-500 group-hover:text-primary group-hover:translate-x-1'}
                        ${isSelected ? 'rotate-90 w-6 h-6' : 'w-4 h-4'}
                      `} />
                    </motion.div>
                  </div>
                </div>

                {/* Progress indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-b-lg"
                  />
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
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
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
                {earnSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                    className="relative"
                  >
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-4 p-6 border border-primary/20 text-center hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <div className="text-primary">
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
                        <div className="bg-white rounded-full p-1 shadow-sm border border-primary/20">
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
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
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7 text-white" />
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
                {borrowSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
                    className="relative"
                  >
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-4 p-6 border border-primary/20 text-center hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <div className="text-primary">
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
                    {index < borrowSteps.length - 1 && (
                      <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <div className="bg-white rounded-full p-1 shadow-sm border border-primary/20">
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Educational Tips */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="space-y-6"
          >
            {/* Section Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-gray-500 font-medium">Ready to Learn More?</span>
              </div>
            </div>

            {/* Quick Tips Row */}
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

            {/* Enhanced Learn More Section */}
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
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 