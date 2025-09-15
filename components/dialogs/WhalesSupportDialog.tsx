'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRightIcon, Check, AlertCircle, HelpCircle, Wallet, Twitter, ExternalLink } from 'lucide-react'
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
import { Send, MessageCircle, Mail } from "lucide-react";
import Link from 'next/link'
import ImageWithDefault from '../ImageWithDefault'

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

interface IWhalesSupportDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    portfolioValue: number
    website?: 'AGGREGATOR' | 'MARKETS'
}

interface ButtonProps {
    logEvent: (eventName: string, properties: any) => void;
    portfolioValue: number;
    walletAddress?: string;
    onInteraction: () => void;
}

const TelegramButton = ({ logEvent, portfolioValue, walletAddress, onInteraction }: ButtonProps) => {
    const telegramUsername = "EugeneUgonna";
    const prefilledText = "Hi Superlend Team, I'd love to know more about personalized support on Superlend!";
    const encodedText = encodeURIComponent(prefilledText);
    const telegramLink = `https://t.me/${telegramUsername}?text=${encodedText}`;

    return (
        <Link
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className='w-full'
            onClick={() => {
                logEvent('whales_support_telegram_clicked', {
                    portfolio_value: portfolioValue,
                    wallet_address: walletAddress
                });
                onInteraction();
            }}
        >
            <Button
                variant="outline"
                className={`flex items-center justify-center gap-2 w-full bg-[#0088CC]/10 border-[#0088CC]/40 hover:bg-[#0088CC]/20 text-[#0088CC] transition-all duration-300 rounded-4 p-2 py-3 hover:py-4`}>
                <ImageWithDefault src="/images/logos/telegram.png" alt="Telegram" width={20} height={20} />
                Connect on Telegram
            </Button>
        </Link>
    );
};

const WhatsAppButton = ({ logEvent, portfolioValue, walletAddress, onInteraction }: ButtonProps) => {
    const phoneNumber = "8884726470";
    const message = "Hi Superlend Team, I'd love to know more about personalized support on Superlend!";
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    return (
        <Link
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className='w-full'
            onClick={() => {
                logEvent('whales_support_whatsapp_clicked', {
                    portfolio_value: portfolioValue,
                    wallet_address: walletAddress
                });
                onInteraction();
            }}
        >
            <Button variant="outline" className={`flex items-center justify-center gap-2 w-full bg-[#3bae47]/10 border-[#3bae47]/40 hover:bg-[#3bae47]/20 text-[#3bae47] hover:py-4 transition-all duration-300 p-2`}>
                <ImageWithDefault src="/images/logos/whatsapp.png" alt="WhatsApp" width={20} height={20} />
                Connect on WhatsApp
            </Button>
        </Link>
    );
};

export function WhalesSupportDialog({
    open,
    setOpen,
    portfolioValue,
    website = 'AGGREGATOR'
}: IWhalesSupportDialogProps) {
    const { logEvent } = useAnalytics()
    const { walletAddress } = useWalletConnection()
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const formattedPortfolioValue = getFormattedPortfolioValue(portfolioValue)
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [isEmailSubmitted, setIsEmailSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            // Log event when dialog is opened
            logEvent('whales_support_dialog_opened', {
                portfolio_value: portfolioValue,
                wallet_address: walletAddress
            })
        }
    }, [open, logEvent, portfolioValue, walletAddress])

    const handleInteraction = () => {
        setOpen(false);
    };

    const validateEmail = (email: string) => {
        if (!email) {
            return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Invalid email address';
        }
        return '';
    };

    const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const error = validateEmail(email);
        setEmailError(error);

        if (error) {
            return;
        }

        setIsSubmitting(true);
        logEvent('whales_support_email_submission_started', {
            email,
            portfolio_value: portfolioValue,
            wallet_address: walletAddress,
            website
        });
        try {
            const response = await fetch('/api/submit-whale-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    walletAddress,
                    portfolioValue,
                    website,
                }),
            });

            if (response.ok) {
                setIsEmailSubmitted(true);
                logEvent('whales_support_email_submitted', {
                    email,
                    portfolio_value: portfolioValue,
                    wallet_address: walletAddress,
                    website
                });
                // Optionally close the dialog after a delay or show a success message longer
                setTimeout(() => {
                    handleInteraction();
                }, 3000); // Close after 3 seconds
            } else {
                const result = await response.json();
                setEmailError(result.message || 'Submission failed. Please try again.');
                logEvent('whales_support_email_submission_failed', {
                    email,
                    portfolio_value: portfolioValue,
                    wallet_address: walletAddress,
                    error: result.message,
                    website
                });
            }
        } catch (err) {
            setEmailError('An unexpected error occurred. Please try again.');
            logEvent('whales_support_email_submission_error', {
                email,
                portfolio_value: portfolioValue,
                wallet_address: walletAddress,
                error: err instanceof Error ? err.message : String(err),
                website
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = (
        <Button
            variant="ghost"
            onClick={() => handleInteraction()}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    )

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
            {isEmailSubmitted ? (
                <div className="flex flex-col items-center justify-center gap-6 py-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-4 shadow-lg shadow-emerald-100/50">
                            <Check className="w-8 h-8 text-white" strokeWidth={3} />
                        </div>
                    </motion.div>
                    <div className="space-y-3 text-center">
                        <HeadingText level="h5" weight="semibold" className="text-gray-900">
                            Thank you!
                        </HeadingText>
                        <BodyText level="body2" className="text-gray-600 max-w-[280px] mx-auto">
                            We have received your email and will get in touch with you shortly.
                        </BodyText>
                    </div>
                </div>
            ) : (
                <>
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
                                Your portfolio of <span className="text-blue-600 font-semibold">{formattedPortfolioValue}</span> qualifies you for personalized support from Superlend Team.
                            </BodyText>
                        </div>
                    </Card>
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
                        Connect with our product manager, and we will get in touch with you in the next 24-48 hours
                    </BodyText>

                    <div className="flex flex-col items-center justify-between gap-3">
                        <TelegramButton
                            logEvent={logEvent}
                            portfolioValue={portfolioValue}
                            walletAddress={walletAddress}
                            onInteraction={handleInteraction}
                        />
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-[1px] w-12 bg-gray-600/50"></div>
                            <div className="text-gray-600/50 text-sm">OR</div>
                            <div className="h-[1px] w-12 bg-gray-600/50"></div>
                        </div>
                        <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-1">
                            <div className='w-full'>
                                <Label htmlFor="email-input" className="text-gray-700 mb-1.5 block text-sm font-medium sr-only">Email</Label>
                                <div className="relative flex items-center w-full bg-sky-100 border border-orange-300 rounded-4 p-1 shadow-sm">
                                    <Mail className="absolute left-4 h-5 w-5 text-gray-500" />
                                    <Input
                                        id="email-input"
                                        type="email"
                                        placeholder="Type email here"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError('');
                                        }}
                                        className={`flex-grow pl-11 pr-28 py-2.5 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-500 text-sm focus:outline-none`}
                                        disabled={isSubmitting}
                                    />
                                    <Button
                                        type="submit"
                                        variant="default"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-[calc(100%-0.75rem)] bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 py-2 text-sm flex items-center gap-1.5 hover:shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75"
                                        disabled={isSubmitting || !email}
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                Submit
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            {emailError && <BodyText level="body3" className="text-red-500 text-xs px-2">{emailError}</BodyText>}
                        </form>
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
                    <Dialog open={open} modal={open}>
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

export default WhalesSupportDialog 