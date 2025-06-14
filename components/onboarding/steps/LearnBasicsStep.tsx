import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Coins, Globe, Lock, TrendingUp, Users, ArrowRight, Wallet, Shield } from 'lucide-react'
import { BodyText, HeadingText } from '@/components/ui/typography'

export const LearnBasicsStep: React.FC = () => {
  const concepts = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "What is DeFi?",
      description: "Decentralized Finance reimagines traditional banking without intermediaries",
      details: "DeFi uses blockchain technology to recreate financial services like lending, borrowing, and trading without traditional banks.",
      gradient: "from-tertiary-blue/20 to-tertiary-lightblue/20",
      iconBg: "bg-tertiary-blue/10",
      iconColor: "text-tertiary-blue/75"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Smart Contracts",
      description: "Self-executing contracts that automatically enforce agreements",
      details: "Code that runs on blockchain, executing transactions automatically when conditions are met - no human intervention needed.",
      gradient: "from-tertiary-pink/75 to-tertiary-pink/20",
      iconBg: "bg-tertiary-pink/50",
      iconColor: "text-pink-600/75"
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Liquidity Pools",
      description: "Shared pots of cryptocurrency that power DeFi protocols",
      details: "Users contribute their tokens to pools, enabling others to trade, borrow, or earn rewards from these shared resources.",
      gradient: "from-tertiary-green/20 to-tertiary-lightgreen/20",
      iconBg: "bg-tertiary-green/10",
      iconColor: "text-tertiary-green/75"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Yield Farming",
      description: "Earning rewards by providing liquidity to DeFi protocols",
      details: "Lend your crypto to protocols and earn interest plus additional token rewards for helping maintain liquidity.",
      gradient: "from-primary/20 to-primary/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary/75"
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Crypto Wallets",
      description: "Your digital vault for storing and managing cryptocurrency",
      details: "Non-custodial wallets give you full control over your assets. Remember: your keys, your crypto. Never share your seed phrase!",
      gradient: "from-tertiary-blue/20 to-tertiary-lightblue/20",
      iconBg: "bg-tertiary-blue/10",
      iconColor: "text-tertiary-blue/75"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Collateralization",
      description: "Using your crypto as security to borrow other assets",
      details: "To borrow in DeFi, you must deposit collateral (usually 150-200% of loan value) to secure the loan and protect lenders.",
      gradient: "from-tertiary-cream/50 to-tertiary-charcoal/5",
      iconBg: "bg-tertiary-cream",
      iconColor: "text-tertiary-charcoal/75"
    }
  ]

  const benefits = [
    "🌍 Global access - anyone with internet can participate",
    "🚀 24/7 operations - markets never close",
    "🔓 Permissionless - no banks or credit checks required",
    "💰 Higher yields - often better returns than traditional finance",
    "🔍 Transparent - all transactions visible on blockchain",
    "🔐 Self-custody - you maintain full control over your assets"
  ]

  return (
    <div className="flex flex-col h-full px-2">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          DeFi Fundamentals
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Master the building blocks of decentralized finance. Understanding these concepts
          will help you navigate the DeFi ecosystem confidently.
        </p>
      </motion.div>

      <div className="flex-1 space-y-8">
        {/* Core Concepts */}
        <div>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-6 text-center"
          >
            Core Concepts
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concepts.map((concept, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`
                  relative bg-gradient-to-br ${concept.gradient} rounded-2xl p-6 
                  border-2 border-gray-200/50 shadow-lg hover:shadow-xl 
                  transition-all duration-300 group overflow-hidden
                `}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />

                {/* Icon */}
                <div className={`w-12 h-12 ${concept.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={concept.iconColor}>
                    {concept.icon}
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-lg font-bold text-gray-900 mb-3 relative z-10">
                  {concept.title}
                </h4>

                <p className="text-gray-700 mb-4 text-sm leading-relaxed relative z-10">
                  {concept.description}
                </p>

                {/* Details */}
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 relative z-10">
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {concept.details}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-xl"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Why DeFi Matters
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              DeFi represents a fundamental shift in how we think about money and financial services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.0 + (index * 0.1) }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white/80 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                  <BodyText level="body2" weight="medium" className="text-gray-800">
                    {benefit}
                  </BodyText>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mt-8 text-center"
      >
        <div className="bg-gradient-to-r from-tertiary-lightblue/50 to-tertiary-lightblue/50 border-2 border-tertiary-blue/20 rounded-2xl p-6 shadow-lg">
          <HeadingText level="h4" weight="medium" className="text-gray-800 mb-2">Ready to dive deeper?</HeadingText>
          <BodyText level="body2" weight="medium" className="text-gray-700">
            Next, we&apos;ll explore specific strategies for earning and managing risk in DeFi protocols.
          </BodyText>
        </div>
      </motion.div>
    </div>
  )
} 