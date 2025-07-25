import React from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Info, TrendingUp, Lock, Eye } from 'lucide-react'
import { BodyText, HeadingText } from '@/components/ui/typography'

export const LearnRiskStep: React.FC = () => {
  const riskFactors = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Smart Contract Risk",
      description: "Risk from bugs or vulnerabilities in protocol smart contracts",
      mitigation: "Use audited, battle-tested protocols with proven track records and insurance coverage",
      level: "Low-Medium",
      color: "blue",
      bgGradient: "from-tertiary-blue/20 to-tertiary-blue/5",
      borderColor: "border-tertiary-blue/75",
      iconBg: "bg-tertiary-blue/10",
      iconColor: "text-tertiary-blue/75"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Market Volatility Risk",
      description: "Crypto asset prices can fluctuate significantly affecting portfolio value",
      mitigation: "Diversify across stablecoins and volatile assets, use dollar-cost averaging strategies",
      level: "Medium-High",
      color: "yellow",
      bgGradient: "from-tertiary-yellow/20 to-tertiary-yellow/5",
      borderColor: "border-tertiary-yellow/75",
      iconBg: "bg-tertiary-yellow/30",
      iconColor: "text-yellow-600"
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Liquidity Risk",
      description: "Difficulty withdrawing funds during periods of high protocol demand or market stress",
      mitigation: "Monitor protocol liquidity metrics, diversify across platforms, maintain emergency reserves",
      level: "Low-Medium",
      color: "purple",
      bgGradient: "from-tertiary-pink/50 to-tertiary-pink/5",
      borderColor: "border-tertiary-pink",
      iconBg: "bg-tertiary-pink/50",
      iconColor: "text-pink-600/50"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Regulatory Risk",
      description: "Potential regulatory changes affecting DeFi protocols and user access",
      mitigation: "Stay informed about regulatory developments, use compliant platforms when possible",
      level: "Medium",
      color: "orange",
      bgGradient: "from-primary/10 to-primary/5",
      borderColor: "border-primary/75",
      iconBg: "bg-primary/10",
      iconColor: "text-primary/75"
    }
  ]

  const riskManagementTips = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Start Small & Gradual",
      description: "Begin with small amounts to understand protocols before scaling up"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Diversification Strategy",
      description: "Spread funds across multiple protocols, chains, and asset types"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Research & Due Diligence",
      description: "Investigate protocol audits, team backgrounds, and community feedback"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Monitor & Reassess",
      description: "Regularly review positions and protocol health metrics"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Emergency Planning",
      description: "Have exit strategies ready and keep some funds in stable, liquid positions"
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: "Stay Informed",
      description: "Follow protocol announcements, security updates, and market developments"
    }
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
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <HeadingText level="h2" weight="bold" className="text-3xl text-gray-800 mb-4 text-center">
          Risk Management in DeFi
        </HeadingText>
        <BodyText level="body1" className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Understanding and managing risks is crucial for long-term success in DeFi.
          Learn how to protect your investments while maximizing opportunities.
        </BodyText>
      </motion.div>

      <div className="flex-1 space-y-8">
        {/* Risk Factors */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <HeadingText level="h3" weight="bold" className="text-gray-800 mb-6 text-center">
              Key Risk Factors
            </HeadingText>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {riskFactors.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`
                  relative bg-gradient-to-br ${risk.bgGradient} rounded-2xl p-6 
                  border-2 ${risk.borderColor} shadow-lg hover:shadow-xl 
                  transition-all duration-300 group overflow-hidden
                `}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />

                {/* Risk level badge */}
                <div className="absolute top-4 right-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${risk.level === 'Low-Medium'
                      ? 'bg-blue-100 text-blue-600'
                      : risk.level === 'Medium-High'
                        ? 'bg-orange-100 text-orange-600'
                        : risk.level === 'Medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {risk.level} Risk
                  </span>
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 ${risk.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={risk.iconColor}>
                    {risk.icon}
                  </div>
                </div>

                {/* Content */}
                <HeadingText level="h4" weight="bold" className="text-gray-900 mb-3 relative z-10">
                  {risk.title}
                </HeadingText>

                <BodyText level="body2" className="text-gray-700 mb-4 leading-relaxed relative z-10">
                  {risk.description}
                </BodyText>

                {/* Mitigation */}
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/50 relative z-10">
                  <BodyText level="body2" weight="semibold" className="text-gray-800 mb-2">How to mitigate:</BodyText>
                  <BodyText level="body2" className="text-gray-800">
                    {risk.mitigation}
                  </BodyText>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Risk Management Tips */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-xl"
        >
          <div className="text-center mb-6">
            <HeadingText level="h3" weight="bold" className="text-2xl text-gray-800 mb-3">
              Risk Management Best Practices
            </HeadingText>
            <BodyText level="body2" className="text-gray-600 max-w-md mx-auto">
              Essential strategies to protect your investments and minimize potential losses
            </BodyText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riskManagementTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.0 + (index * 0.1) }}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 hover:bg-white/80 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="text-primary">
                      {tip.icon}
                    </div>
                  </div>
                  <div>
                    <HeadingText level="h4" weight="semibold" className="text-gray-900 mb-2">
                      {tip.title}
                    </HeadingText>
                    <BodyText level="body2" className="text-gray-600 leading-relaxed">
                      {tip.description}
                    </BodyText>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Bottom Notice */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mt-8"
      >
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <HeadingText level="h4" weight="bold" className="text-amber-900 mb-2">Remember: Risk = Opportunity</HeadingText>
              <BodyText level="body2" className="text-amber-800 leading-relaxed">
                DeFi offers unprecedented opportunities, but with great potential comes responsibility.
                Never invest more than you can afford to lose, and always prioritize learning and
                understanding over potential returns.
              </BodyText>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 