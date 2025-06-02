import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

export const WelcomeStep: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 sm:space-y-6 py-4 sm:py-8 px-4 sm:px-0">
      {/* Hero Section */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4 sm:space-y-6"
      >
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-br from-primary-gradientStart to-primary-gradientEnd rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-accent-lightGreen rounded-full animate-pulse" />
        </div>

        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-gradientStart to-primary-gradientEnd bg-clip-text text-transparent">
              Superlend
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
            Your gateway to DeFi excellence. We&apos;ll guide you through earning, borrowing, 
            and learning about decentralized finance in just a few simple steps.
          </p>
        </div>
      </motion.div>

      {/* Mission Statement */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-3xl"
      >
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-4 p-4 sm:p-6 md:p-8 border border-primary/20 mx-2 sm:mx-4 md:mx-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-3 md:mb-4">
            Simplifying DeFi for Everyone
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Whether you&apos;re looking to earn passive income, access liquidity, or learn about 
            decentralized finance, Superlend provides the tools and guidance you need to 
            navigate the DeFi ecosystem with confidence.
          </p>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center space-y-2 sm:space-y-3 md:space-y-4 pb-2 sm:pb-4"
      >
        <div className="flex items-center justify-center gap-2 text-primary font-medium">
          <span className="text-sm sm:text-base">Ready to get started?</span>
          <ArrowRight className="w-4 h-4" />
        </div>
        <p className="text-gray-500 text-xs sm:text-sm">
          This personalized tour takes less than 2 minutes
        </p>
      </motion.div>
    </div>
  )
} 