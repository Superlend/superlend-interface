'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, ArrowRight, TestTubes } from 'lucide-react'
import { Button } from './ui/button'
import { BodyText } from './ui/typography'
import { motion, AnimatePresence } from 'framer-motion'
import useGetBoostRewards from '@/hooks/useGetBoostRewards'
import { useGetEffectiveApy } from '@/hooks/useGetEffectiveApy'
import { abbreviateNumber } from '@/lib/utils'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useOnboardingContext } from '@/components/providers/OnboardingProvider'
const BANNER_VARIANTS = [
    'gradient',
    'accent',
    'dark',
    'highlight',
    'navy',
    'forest',
    'neon',
    'pastel',
    'midnight',
] as const
type BannerVariant = (typeof BANNER_VARIANTS)[number]

interface BannerStyle {
    container: string
    button: string
    text: string
    highlight: string
}

export default function TopBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const { logEvent } = useAnalytics()
    const { isOpen: isOnboardingOpen } = useOnboardingContext()
    const [currentVariantIndex, setCurrentVariantIndex] = useState(
        BANNER_VARIANTS.length - 1
    )
    const [isMobile, setIsMobile] = useState(false)
    const variant = BANNER_VARIANTS[currentVariantIndex]
    const BASE_CHAIN_ID = 8453
    const BASE_VAULT_ADDRESS = '0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B'
    const {
        data: effectiveApyData,
        isLoading: isLoadingEffectiveApy,
        isError: isErrorEffectiveApy,
    } = useGetEffectiveApy({
        vault_address: BASE_VAULT_ADDRESS as `0x${string}`,
        chain_id: BASE_CHAIN_ID,
    })
    const {
        data: BOOST_APY,
        isLoading: isLoadingBoostRewards,
        error: errorBoostRewards,
    } = useGetBoostRewards({
        vaultAddress: BASE_VAULT_ADDRESS as `0x${string}`,
        chainId: BASE_CHAIN_ID,
    })
    const TOTAL_VAULT_APY = abbreviateNumber(
        Number(effectiveApyData?.total_apy ?? 0) +
            Number((BOOST_APY?.[0]?.boost_apy ?? 0) / 100)
    )

    useEffect(() => {
        // Add initial delay before showing the banner
        const timer = setTimeout(() => {
            setIsVisible(true)
            document.documentElement.classList.add('banner-visible')
        }, 1000)

        // Check screen size initially and on resize
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640) // Using 640px as the breakpoint (sm in Tailwind)
        }

        checkScreenSize() // Check initial screen size
        window.addEventListener('resize', checkScreenSize)

        return () => {
            clearTimeout(timer)
            document.documentElement.classList.remove('banner-visible')
            window.removeEventListener('resize', checkScreenSize)
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        document.documentElement.classList.remove('banner-visible')
    }

    const handleLaunchSuperFundClick = () => {
        logEvent('launch_superfund_banner_clicked')
        window.open('https://funds.superlend.xyz/super-fund/base', '_blank')
    }

    // Testing function to cycle through variants
    const cycleVariant = () => {
        setCurrentVariantIndex((prev) => (prev + 1) % BANNER_VARIANTS.length)
    }

    const variants: Record<BannerVariant, BannerStyle> = {
        gradient: {
            container:
                'bg-gradient-to-r from-[#E5F3FF] via-[#F0F9FF] to-[#E5F3FF] border-b border-[#D1E9FF]',
            button: 'bg-white hover:bg-opacity-90',
            text: 'text-gray-800',
            highlight: 'text-secondary-500 font-semibold',
        },
        accent: {
            container: 'bg-secondary-500/75 bg-opacity-10',
            button: 'bg-gray-200 border-0',
            text: 'text-gray-200',
            highlight: 'text-gray-200 font-semibold',
        },
        dark: {
            container: 'bg-gray-800',
            button: 'bg-white hover:bg-opacity-90 border-0',
            text: 'text-white',
            highlight: 'text-primary font-semibold',
        },
        highlight: {
            container: 'bg-[#FFD700] bg-opacity-10 border-b border-[#FFD700]',
            button: 'bg-[#FFD700] hover:bg-opacity-90 border-0',
            text: 'text-gray-800',
            highlight: 'text-[#B8860B] font-semibold',
        },
        navy: {
            container: 'bg-[#0F244B]',
            button: 'bg-[#B0E3FF] hover:bg-opacity-90 border-0 text-[#0F244B]',
            text: 'text-white',
            highlight: 'text-[#B0E3FF] font-semibold',
        },
        forest: {
            container: 'bg-[#265739]',
            button: 'bg-[#D4FFDF] hover:bg-opacity-90 border-0 text-[#265739]',
            text: 'text-white',
            highlight: 'text-[#D4FFDF] font-semibold',
        },
        neon: {
            container: 'bg-[#2A2826]',
            button: 'bg-[#F1FF52] hover:bg-opacity-90 border-0 text-[#2A2826]',
            text: 'text-white',
            highlight: 'text-[#F1FF52] font-semibold',
        },
        pastel: {
            container: 'bg-[#FFFFCC] border-b border-[#F9CAF4]',
            button: 'bg-[#1550FF] hover:bg-opacity-90 border-0 text-white',
            text: 'text-[#0F244B]',
            highlight: 'text-[#1550FF] font-semibold',
        },
        midnight: {
            container: 'bg-gradient-to-r from-[#0F244B] to-[#2A2826]',
            button: 'bg-[#F9CAF4] border-0 text-[#0F244B]',
            text: 'text-white',
            highlight: 'text-[#F9CAF4] font-semibold',
        },
    }

    const currentVariant = variants[variant]

    // Define the animation properties based on screen size
    const bannerAnimation = isMobile
        ? {
              initial: { height: 0 },
              animate: { height: 'auto' },
              exit: { height: 0 },
          }
        : {
              initial: { height: 0 },
              animate: { height: 44 },
              exit: { height: 0 },
          }

    // Hide banner if onboarding is open on mobile
    const shouldShowBanner = isVisible && !isOnboardingOpen

    return (
        <AnimatePresence>
            {shouldShowBanner && (
                <>
                    {/* REMOVE IN PRODUCTION - Variant Toggle Button */}
                    {/* <div className="fixed top-2 right-2 z-[61]">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/80 backdrop-blur-sm"
                            onClick={cycleVariant}
                        >
                            <TestTubes className="w-4 h-4 mr-2" />
                            <span className="text-xs">
                                Test Variant: {variant}
                            </span>
                        </Button>
                    </div> */}

                    <motion.div
                        initial={bannerAnimation.initial}
                        animate={bannerAnimation.animate}
                        exit={bannerAnimation.exit}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className={`fixed top-0 left-0 w-full z-[100] overflow-hidden ${currentVariant.container}`}
                    >
                        {/* Animated background elements */}
                        <motion.div
                            className="absolute inset-0 w-full h-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                        >
                            {variant === 'gradient' && (
                                <motion.div
                                    className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-secondary-500/5 via-transparent to-secondary-500/5"
                                    animate={{
                                        x: ['-100%', '100%'],
                                    }}
                                    transition={{
                                        duration: 10,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                />
                            )}
                            {variant === 'dark' && (
                                <div className="absolute inset-0 opacity-20">
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute h-1 w-1 bg-white rounded-full"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                            }}
                                            animate={{
                                                scale: [0, 1, 0],
                                                opacity: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: i * 0.4,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            {variant === 'neon' && (
                                <div className="absolute inset-0">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute h-1 w-[30%] bg-[#F1FF52] rounded-full opacity-30"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                                rotate: `${Math.random() * 360}deg`,
                                            }}
                                            animate={{
                                                opacity: [0.1, 0.3, 0.1],
                                                width: ['10%', '30%', '10%'],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                delay: i * 0.5,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            {variant === 'midnight' && (
                                <div className="absolute inset-0">
                                    {[...Array(8)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute h-1 w-1 bg-[#F9CAF4] rounded-full"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                            }}
                                            animate={{
                                                scale: [0, 1, 0],
                                                opacity: [0, 0.7, 0],
                                            }}
                                            transition={{
                                                duration: 2.5,
                                                repeat: Infinity,
                                                delay: i * 0.3,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            className="max-w-[1200px] mx-auto px-4 flex items-center justify-between relative py-2 sm:py-0 sm:h-[44px]"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                                <div className="flex-1 flex items-center justify-center sm:justify-start gap-2">
                                    <motion.div
                                        animate={{ rotate: [0, 35, 50, 0] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 2,
                                        }}
                                        className="relative"
                                    >
                                        {[
                                            'dark',
                                            'navy',
                                            'forest',
                                            'neon',
                                            'midnight',
                                        ].includes(variant)
                                            ? '⭐'
                                            : '🚀'}
                                        <motion.div
                                            className="absolute -top-1 -right-1"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                repeatDelay: 1,
                                            }}
                                        >
                                            <Sparkles className="w-3 h-3 text-yellow-400" />
                                        </motion.div>
                                    </motion.div>
                                    <BodyText
                                        level="body2"
                                        className={`${currentVariant.text} text-center sm:text-left`}
                                    >
                                        Maximize your USDC returns with
                                        SuperFund - Earn up to{' '}
                                        <span
                                            className={currentVariant.highlight}
                                        >
                                            {TOTAL_VAULT_APY}% APY
                                        </span>{' '}
                                        across trusted lending protocols
                                    </BodyText>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        variant="secondaryOutline"
                                        size="sm"
                                        className={`whitespace-nowrap flex relative group overflow-hidden ${currentVariant.button}`}
                                        onClick={handleLaunchSuperFundClick}
                                    >
                                        <span className="relative z-10 flex items-center gap-1">
                                            Launch App
                                            <motion.div
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    repeatDelay: 1,
                                                }}
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </motion.div>
                                        </span>
                                        <motion.div
                                            className="absolute inset-0 bg-white opacity-0 group-hover:opacity-90 transition-opacity duration-300"
                                            initial={false}
                                            whileHover={{ scale: 1.2 }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </Button>
                                </motion.div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`p-1 hover:bg-white/10 rounded-full ${['dark', 'navy', 'forest', 'neon', 'midnight'].includes(variant) ? 'text-white hover:text-white' : 'text-gray-500 hover:text-gray-500'}`}
                                        onClick={handleClose}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
