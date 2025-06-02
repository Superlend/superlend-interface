import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, CreditCard, GraduationCap, ArrowRight, Sparkles, Star, Zap } from 'lucide-react'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
import type { OnboardingPath } from '@/hooks/useOnboarding'

export const ChoosePathStep: React.FC = () => {
  const { selectedPath, setPath } = useOnboardingContext()

  const handlePathSelect = (path: OnboardingPath, pathTitle: string) => {
    console.log('🎮 Path selected:', path, pathTitle)
    setPath(path)
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
    },
    {
      path: 'borrow' as OnboardingPath,
      title: 'Borrow Crypto',
      description: "Access liquidity while keeping your assets. Unlock your crypto's potential without selling!",
      icon: <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-indigo-400/20',
      hoverGradient: 'bg-gradient-to-br from-blue-400/40 to-indigo-400/40',
      accentColor: 'bg-gradient-to-br from-blue-400 to-cyan-500',
    },
    {
      path: 'learn' as OnboardingPath,
      title: 'Learn about DeFi',
      description: 'Master decentralized finance from basics to advanced. Become a DeFi expert step by step!',
      icon: <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />,
      gradient: 'bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-rose-400/20',
      hoverGradient: 'bg-gradient-to-br from-purple-400/40 to-rose-400/40',
      accentColor: 'bg-gradient-to-br from-purple-400 to-pink-500',
    },
  ]

  console.log('🎮 Current selectedPath:', selectedPath)

  return (
    <div className="h-full flex flex-col space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Choose Your DeFi Journey
        </h2>
        <p className="text-base sm:text-lg text-foreground max-w-2xl mx-auto">
          Select the path that interests you most. We&apos;ll customize your experience 
          and show you exactly how Superlend can help you achieve your goals.
        </p>
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

                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(isSelected ? 6 : 3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1 h-1 ${pathData.accentColor} rounded-full ${isSelected ? 'opacity-20' : 'opacity-10 group-hover:opacity-15'}`}
                      animate={{
                        x: [0, 80, 0],
                        y: [0, -40, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: isSelected ? 3 + i : 4 + i * 0.5,
                        repeat: Infinity,
                        delay: i * (isSelected ? 0.5 : 0.8),
                        ease: "easeInOut"
                      }}
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${30 + i * 15}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Subtle floating elements for unselected cards */}
                {!isSelected && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    {[...Array(2)].map((_, i) => (
                      <motion.div
                        key={`float-${i}`}
                        className={`absolute w-8 h-8 ${pathData.accentColor} rounded-full opacity-5`}
                        animate={{
                          y: [0, -20, 0],
                          scale: [0.8, 1.2, 0.8],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 6 + i * 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 1.5
                        }}
                        style={{
                          left: `${25 + i * 50}%`,
                          top: `${20 + i * 40}%`,
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
                          : `bg-gradient-to-br from-gray-100/80 to-gray-200/50 group-hover:from-gray-200/80 group-hover:to-gray-300/60 shadow-sm group-hover:shadow-md`
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

                      {/* Subtle glow for unselected on hover */}
                      {!isSelected && (
                        <motion.div
                          className={`absolute inset-0 rounded-lg ${pathData.accentColor} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm`}
                          initial={{ scale: 0.8 }}
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.3 }}
                        />
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
                      <div className="flex items-center gap-3">
                        <Zap className={`w-4 h-4 transition-all duration-300 ${isSelected ? 'text-primary' : 'text-gray-700 group-hover:text-primary group-hover:scale-110'}`} />
                        <span className={`
                          text-sm font-semibold transition-colors duration-300
                          ${isSelected ? 'text-primary' : 'text-gray-800 group-hover:text-primary'}
                        `}>
                          {isSelected ? 'Path Unlocked!' : 'Explore this path'}
                        </span>
                      </div>
                      
                      <motion.div
                        animate={{ x: isSelected ? [0, 4, 0] : 0 }}
                        transition={{ duration: 1, repeat: isSelected ? Infinity : 0 }}
                        className="group-hover:scale-110 transition-transform duration-300"
                      >
                        <ArrowRight className={`
                          w-4 h-4 transition-colors duration-300
                          ${isSelected ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}
                        `} />
                      </motion.div>
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

      {/* Footer Text */}
      <div className="text-center space-y-4 pb-4">
        {selectedPath ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20 max-w-md mx-auto"
          >
            {/* <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-current" /> */}
            <p className="text-sm sm:text-base text-primary font-semibold">
              🎯 Perfect choice! Ready to begin your {selectedPath} journey?
            </p>
          </motion.div>
        ) : (
          <motion.p 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-foreground text-base sm:text-lg"
          >
            ✨ Choose your path above to start your DeFi adventure!
          </motion.p>
        )}
      </div>
    </div>
  )
} 