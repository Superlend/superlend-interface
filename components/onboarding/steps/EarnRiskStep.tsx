import React from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Info, TrendingUp, Lock, Eye } from 'lucide-react'

export const EarnRiskStep: React.FC = () => {
  const riskFactors = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Smart Contract Risk",
      description: "Risk from bugs or vulnerabilities in protocol smart contracts",
      mitigation: "We only partner with audited, battle-tested protocols with proven track records",
      level: "Low",
      color: "green",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Market Volatility",
      description: "Crypto asset prices can fluctuate significantly affecting returns",
      mitigation: "Diversify across stablecoins and volatile assets to balance risk-reward",
      level: "Medium",
      color: "yellow",
      bgGradient: "from-yellow-50 to-amber-50",
      borderColor: "border-yellow-200",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Liquidity Risk",
      description: "Temporary withdrawal delays during periods of high protocol demand",
      mitigation: "Monitor protocol liquidity in real-time and diversify across platforms",
      level: "Low",
      color: "blue",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    }
  ]

  const safetyFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Real-time Protocol Health Monitoring",
      description: "24/7 surveillance of protocol performance and security metrics"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Automated Risk Scoring Algorithms",
      description: "AI-powered risk assessment for all supported protocols"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Emergency Withdrawal Mechanisms",
      description: "Quick exit strategies during protocol emergencies"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Insurance Protocol Integrations",
      description: "Additional coverage through leading DeFi insurance providers"
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Understanding Risks & Safety
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          We believe in transparent communication about risks. Here's how we help you 
          earn safely while maximizing your returns.
        </p>
      </motion.div>

      <div className="flex-1 space-y-10">
        {/* Risk Factors */}
        <div>
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-8 text-center"
          >
            Key Risk Factors
          </motion.h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {riskFactors.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`
                  relative bg-gradient-to-br ${risk.bgGradient} rounded-2xl p-8 
                  border-2 ${risk.borderColor} shadow-xl hover:shadow-2xl 
                  transition-all duration-300 group overflow-hidden
                `}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
                
                {/* Risk level badge */}
                <div className="absolute top-4 right-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${risk.level === 'Low' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-yellow-200 text-yellow-800'
                    }
                  `}>
                    {risk.level} Risk
                  </span>
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 ${risk.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={risk.iconColor}>
                    {risk.icon}
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-xl font-bold text-gray-900 mb-4 relative z-10">
                  {risk.title}
                </h4>
                
                <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                  {risk.description}
                </p>
                
                {/* Mitigation */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 relative z-10">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold text-gray-900">How we mitigate:</span>
                    <br />
                    {risk.mitigation}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Safety Measures */}
        {/* <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 border-2 border-primary/20 shadow-xl"
        >
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Our Safety Measures
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safetyFeatures.map((feature, index) => (
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
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div> */}
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
              <h4 className="font-bold text-amber-900 mb-2">Important Disclaimer</h4>
              <p className="text-amber-800 leading-relaxed">
                All DeFi activities carry inherent risks. Cryptocurrency investments are volatile and can result in significant losses. 
                Only invest what you can afford to lose and always conduct your own research before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 