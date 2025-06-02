import React from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Coins, Zap, Shield, DollarSign, BarChart3, Layers } from 'lucide-react'

export const LearnStrategiesStep: React.FC = () => {
  const strategies = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Stablecoin Lending",
      description: "Low-risk strategy lending stablecoins like USDC, USDT, DAI",
      returns: "3-8% APY",
      riskLevel: "Low",
      timeCommitment: "Flexible",
      details: "Earn steady returns by lending stablecoins to borrowers. Great for beginners due to reduced volatility risk.",
      gradient: "from-green-400/20 to-emerald-400/20",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      riskColor: "text-green-600",
      riskBg: "bg-green-100"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Yield Farming",
      description: "Provide liquidity to earn trading fees plus token rewards",
      returns: "8-25% APY",
      riskLevel: "Medium",
      timeCommitment: "Active",
      details: "Supply tokens to liquidity pools and earn both trading fees and additional protocol tokens as rewards.",
      gradient: "from-blue-400/20 to-cyan-400/20",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      riskColor: "text-yellow-600",
      riskBg: "bg-yellow-100"
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Liquid Staking",
      description: "Stake ETH while maintaining liquidity through derivative tokens",
      returns: "4-6% APY",
      riskLevel: "Low-Medium",
      timeCommitment: "Passive",
      details: "Stake ETH to secure the network while receiving liquid tokens that can be used in other DeFi protocols.",
      gradient: "from-purple-400/20 to-pink-400/20",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      riskColor: "text-blue-600",
      riskBg: "bg-blue-100"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Delta Neutral Strategies",
      description: "Hedge market exposure while earning yield",
      returns: "6-15% APY",
      riskLevel: "Medium",
      timeCommitment: "Active",
      details: "Maintain balanced long and short positions to earn yield while minimizing price exposure.",
      gradient: "from-orange-400/20 to-red-400/20",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      riskColor: "text-yellow-600",
      riskBg: "bg-yellow-100"
    }
  ]

  const keyPrinciples = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Start Small & Learn",
      description: "Begin with small amounts to understand how protocols work"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Diversification",
      description: "Spread risk across multiple protocols and strategies"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Compound Returns",
      description: "Reinvest earnings to accelerate growth over time"
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Gas Optimization",
      description: "Time transactions and batch operations to minimize fees"
    }
  ]

  const getRiskLevelColor = (level: string) => {
    switch(level) {
      case 'Low': return 'text-green-600 bg-green-100'
      case 'Low-Medium': return 'text-blue-600 bg-blue-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'High': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Earning Strategies
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Discover proven strategies to maximize your DeFi returns. Each approach has different 
          risk profiles and time commitments to match your goals.
        </p>
      </motion.div>

      <div className="flex-1 space-y-8">
        {/* Strategies Grid */}
        <div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-6 text-center"
          >
            Popular Strategies
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategies.map((strategy, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`
                  relative bg-gradient-to-br ${strategy.gradient} rounded-2xl p-6 
                  border-2 border-gray-200/50 shadow-lg hover:shadow-xl 
                  transition-all duration-300 group overflow-hidden
                `}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
                
                {/* Risk badge */}
                <div className="absolute top-4 right-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${getRiskLevelColor(strategy.riskLevel)}
                  `}>
                    {strategy.riskLevel} Risk
                  </span>
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 ${strategy.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={strategy.iconColor}>
                    {strategy.icon}
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-xl font-bold text-gray-900 mb-3 relative z-10">
                  {strategy.title}
                </h4>
                
                <p className="text-gray-700 mb-4 text-sm leading-relaxed relative z-10">
                  {strategy.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Expected Returns</p>
                    <p className="font-bold text-green-600">{strategy.returns}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Time Commitment</p>
                    <p className="font-bold text-gray-800">{strategy.timeCommitment}</p>
                  </div>
                </div>
                
                {/* Details */}
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 relative z-10">
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {strategy.details}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Key Principles */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-xl"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Success Principles
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Follow these guidelines to maximize your success in DeFi earning strategies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keyPrinciples.map((principle, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.0 + (index * 0.1) }}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 hover:bg-white/80 transition-all duration-300 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-primary">
                      {principle.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {principle.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Notice */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mt-8 text-center"
      >
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
          <h4 className="font-bold text-gray-900 mb-2">Strategy Selection Tip</h4>
          <p className="text-gray-700 text-sm">
            Choose strategies that match your risk tolerance and time availability. You can always start 
            conservative and gradually explore higher-yield opportunities as you gain experience.
          </p>
        </div>
      </motion.div>
    </div>
  )
} 