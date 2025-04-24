'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRightIcon, Check, AlertCircle, HelpCircle, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from '@/components/ui/dialog'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import useDimensions from '@/hooks/useDimensions'
import { Card } from '../ui/card'
import { submitTelegramUsername, validateTelegramUsername } from '@/services/telegram-service'
import { getFormattedPortfolioValue } from '@/lib/portfolio-utils'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import InfoTooltip from '@/components/tooltips/InfoTooltip'
import { motion, AnimatePresence } from 'framer-motion'

// Animation variants for dialog
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
};

const dialogVariants = {
    hidden: { opacity: 0, y: 500 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        opacity: 0,
        y: 500,
        transition: {
            duration: 0.2,
            ease: "easeOut"
        }
    }
};

// Animation variants for drawer
const drawerVariants = {
    hidden: { y: "100%" },
    visible: {
        y: 0,
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        y: "100%",
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};

interface ITelegramConnectionDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    portfolioValue: number
    website?: 'AGGREGATOR' | 'MARKETS'
}

export function TelegramConnectionDialog({
    open,
    setOpen,
    portfolioValue,
    website = 'AGGREGATOR'
}: ITelegramConnectionDialogProps) {
    const { logEvent } = useAnalytics()
    const { walletAddress } = useWalletConnection()
    const [telegramUsername, setTelegramUsername] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState('')
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const formattedPortfolioValue = getFormattedPortfolioValue(portfolioValue)

    useEffect(() => {
        if (open) {
            // Log event when dialog is opened
            logEvent('telegram_connection_dialog_opened', {
                portfolio_value: portfolioValue,
                wallet_address: walletAddress
            })
        }
    }, [open, logEvent, portfolioValue, walletAddress])

    function handleOpenChange(open: boolean) {
        setOpen(open)
        if (!open) {
            // Reset state when dialog is closed
            setTimeout(() => {
                setTelegramUsername('')
                setIsSubmitted(false)
                setError('')
            }, 300)
        }
    }

    function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setTelegramUsername(value);

        // Clear error when user starts typing
        if (error) setError('');

        // Real-time validation (optional but only if value is not empty)
        if (value.trim().length > 0) {
            const validationError = validateTelegramUsername(value);
            if (validationError) {
                setError(validationError);
            }
        }
    }

    async function handleSubmit() {
        const validationError = validateTelegramUsername(telegramUsername)
        if (validationError) {
            setError(validationError)
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await submitTelegramUsername({
                telegramUsername,
                walletAddress,
                portfolioValue,
                website
            })

            if (response.success) {
                setIsSubmitted(true)
                logEvent('telegram_username_submitted', {
                    portfolio_value: portfolioValue,
                    wallet_address: walletAddress
                })
            } else {
                setError(response.message || 'Failed to submit. Please try again.')
                logEvent('telegram_username_submission_failed', {
                    portfolio_value: portfolioValue,
                    wallet_address: walletAddress,
                    error: response.message
                })
            }
        } catch (err) {
            setError('Failed to submit. Please try again.')
            logEvent('telegram_username_submission_failed', {
                portfolio_value: portfolioValue,
                wallet_address: walletAddress,
                error: err instanceof Error ? err.message : String(err)
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleSkip() {
        logEvent('telegram_connection_skipped', {
            portfolio_value: portfolioValue,
            wallet_address: walletAddress
        })
        handleOpenChange(false)
    }

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = !isSubmitting ? (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <HeadingText
            level="h4"
            weight="medium"
            className="text-gray-800 text-center"
        >
            We need your inputs!
        </HeadingText>
    )

    // SUB_COMPONENT: Content body UI
    const contentBody = (
        <div className="flex flex-col gap-4 max-w-full overflow-hidden">
            {/* Success state */}
            {isSubmitted ? (
                <Card className="p-4 bg-green-50 border border-green-200 rounded-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00AD31] bg-opacity-15 rounded-full flex items-center justify-center">
                            <Check
                                className="w-5 h-5 stroke-[#013220]/75"
                                strokeWidth={1.5}
                            />
                        </div>
                        <BodyText
                            level="body1"
                            weight="medium"
                            className="text-gray-800"
                        >
                            Thank you! We&apos;ll connect with you soon.
                        </BodyText>
                    </div>
                    
                    {/* Join Discord button */}
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            className="w-full py-[13px] rounded-5 border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                                window.open('https://discord.gg/superlend', '_blank');
                                logEvent('telegram_join_discord_clicked', {
                                    portfolio_value: portfolioValue,
                                    wallet_address: walletAddress
                                });
                            }}
                        >
                            Join our Discord Community
                        </Button>
                        <BodyText
                            level="body3"
                            weight="normal"
                            className="text-gray-600 text-center mt-2"
                        >
                            Join our active community for the latest updates and support
                        </BodyText>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Message */}
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="text-gray-800"
                    >
                        Hope you&apos;ve been enjoying Superlend. 
                        Our product manager would like to have a chat with you and ask you a few questions to understand how best we can add value to you.
                        This will help us build the best DeFi products for you.
                    </BodyText>

                    <BodyText
                        level="body2"
                        weight="normal"
                        className="text-gray-800"
                    >
                        Do drop-in your Telegram username, and our PM will reach out in the next 24-48 hours
                    </BodyText>

                    {/* Portfolio value context */}
                    <Card className="p-4 bg-gradient-to-r from-blue-50 to-gray-50 border border-blue-300 rounded-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-blue-600" strokeWidth={2} />
                            </div>
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-800"
                            >
                                Your portfolio of <span className="text-blue-600 font-semibold">{formattedPortfolioValue}</span> qualifies you for personalized support from our team.
                            </BodyText>
                        </div>
                    </Card>

                    {/* Input field */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="telegram-username" size="medium">Your Telegram Username</Label>
                            <InfoTooltip
                                content={
                                    <div className="space-y-2 max-w-xs">
                                        <BodyText level="body2" weight="normal" className="text-gray-700">
                                            Your Telegram username can be found in your Telegram profile settings.
                                        </BodyText>
                                        <div className="h-[1px] bg-gray-400" />
                                        <BodyText level="body2" weight="normal" className="text-gray-700">
                                            To get your Telegram username:
                                        </BodyText>
                                        <ol className="pl-4 list-decimal space-y-1">
                                            <li className="text-gray-700 text-sm">Open Telegram</li>
                                            <li className="text-gray-700 text-sm">Go to Settings</li>
                                            <li className="text-gray-700 text-sm">Tap on your profile</li>
                                            <li className="text-gray-700 text-sm">Your username will be listed as @username</li>
                                        </ol>
                                    </div>
                                }
                            />
                        </div>
                        <Input
                            id="telegram-username"
                            value={telegramUsername}
                            onChange={handleUsernameChange}
                            placeholder="Enter your Telegram username (e.g. @username)"
                            className={`rounded-5 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                        {error && (
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-red-500 flex items-center gap-1"
                            >
                                <AlertCircle size={14} />
                                {error}
                            </BodyText>
                        )}
                        <BodyText
                            level="body3"
                            weight="normal"
                            className="text-gray-600"
                        >
                            Your information will only be used for product improvement purposes.
                        </BodyText>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !telegramUsername.trim()}
                            variant="primary"
                            className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
                        >
                            <span className="uppercase leading-[0]">
                                Connect
                            </span>
                            {isSubmitting ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-r-transparent rounded-full ml-2" />
                            ) : (
                                <ArrowRightIcon
                                    width={16}
                                    height={16}
                                    className="stroke-white group-[:disabled]:opacity-50"
                                />
                            )}
                        </Button>
                        {/* <Button
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            variant="outline"
                            className="py-[13px] rounded-5"
                        >
                            Maybe later
                        </Button> */}
                    </div>
                </>
            )}
        </div>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <AnimatePresence mode="wait">
                {open && (
                    <Dialog open={open} modal={true}>
                        <motion.div
                            className="fixed inset-0 z-50"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={backdropVariants}
                        >
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={dialogVariants}
                                    className="relative"
                                >
                                    <DialogContent
                                        aria-describedby={undefined}
                                        className="pt-[25px] max-w-[450px] rounded-md"
                                        showCloseButton={false}
                                    >
                                        {closeContentButton}
                                        <DialogHeader>{contentHeader}</DialogHeader>
                                        {contentBody}
                                    </DialogContent>
                                </motion.div>
                            </div>
                        </motion.div>
                    </Dialog>
                )}
            </AnimatePresence>
        )
    }

    // Mobile UI
    return (
        <AnimatePresence mode="wait">
            {open && (
                <Drawer open={open} dismissible={false}>
                    <motion.div
                        className="fixed inset-0 bg-black/25 z-50"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={backdropVariants}
                    >
                        <div className="fixed inset-x-0 bottom-0 flex justify-center">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={drawerVariants}
                                className="w-full"
                            >
                                <DrawerContent className="w-full p-5 pt-2 dismissible-false rounded-t-[20px]">
                                    {closeContentButton}
                                    <DrawerHeader>{contentHeader}</DrawerHeader>
                                    {contentBody}
                                </DrawerContent>
                            </motion.div>
                        </div>
                    </motion.div>
                </Drawer>
            )}
        </AnimatePresence>
    )
}

export default TelegramConnectionDialog 