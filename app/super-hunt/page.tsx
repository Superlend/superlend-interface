/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useRef, useState } from 'react'
import MainContainer from '@/components/MainContainer'
import { cn } from '@/lib/utils'
import EasterEggSolved from '@/components/EasterEggSolved'
import EasterEggImage from './easter-egg-image'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

interface CursorPosition {
    x: number
    y: number
}

const EasterEgg = () => {
    const [showOverlay, setShowOverlay] = useState(false)
    const [isSolved, setSolved] = useState(false)
    const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
        x: 0,
        y: 0,
    })
    const { address: walletAddress } = useAccount()
    const router = useRouter()
    const previousWalletAddress = useRef<string | undefined>(undefined)

    useEffect(() => {
        document.cookie = 'accessEasterEgg=false;'
    }, [])

    useEffect(() => {
        if (
            previousWalletAddress.current !== undefined &&
            walletAddress !== previousWalletAddress.current
        ) {
            router.push('/discover') // Immediate client navigation
            window.location.replace('/discover') // Perform full reload
        }

        previousWalletAddress.current = walletAddress
    }, [walletAddress, router])

    useEffect(() => {
        toast(
            "Easter Egg Alert! 🥚\n\nWe've hidden a surprise on this page. Can you find it? 👀",
            {
                duration: 10000,
            }
        )

        setShowOverlay(true)
    }, [])

    useEffect(() => {
        if (!isSolved) {
            const hintTimeout = setTimeout(() => {
                toast('Hint: Hover on the page to see the Easter Egg!', {
                    duration: 10000,
                })
            }, 30000)

            return () => clearTimeout(hintTimeout)
        }
    }, [isSolved])

    useEffect(() => {
        if (showOverlay) {
            document.documentElement.style.cursor = 'none'
            document.documentElement.style.overflow = 'hidden'
        } else {
            document.documentElement.style.cursor = 'auto'
            document.documentElement.style.overflow = 'auto'
        }

        return () => {
            document.documentElement.style.cursor = 'auto'
            document.documentElement.style.overflow = 'auto'
        }
    }, [showOverlay])

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY })
        }
        const handleTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0]
            if (touch) {
                setCursorPosition({ x: touch.clientX, y: touch.clientY })
            }
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('touchmove', handleTouchMove)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('touchmove', handleTouchMove)
        }
    }, [])

    // After Details
    const afterDeatilsRef = useRef<HTMLDivElement>(null)
    const handleScroll = () => {
        if (afterDeatilsRef.current) {
            const elementPosition =
                afterDeatilsRef.current.getBoundingClientRect().top +
                window.scrollY
            const deviceOffset = window.innerWidth < 768 ? 70 : 90
            const offsetPosition = elementPosition - deviceOffset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            })
        }
    }

    return (
        <MainContainer>
            <div className="flex items-center justify-center relative">
                <div
                    className={cn(
                        'fixed inset-0 z-50 pointer-events-none duration-500',
                        {
                            'bg-black': showOverlay,
                        }
                    )}
                    style={{
                        maskImage: `radial-gradient(circle ${cursorPosition.x ? '80' : '0'}px at ${
                            cursorPosition.x
                        }px ${cursorPosition.y}px, transparent 50%, black 100%)`,
                        WebkitMaskImage: `radial-gradient(circle ${cursorPosition.x ? '80' : '0'}px at ${
                            cursorPosition.x
                        }px ${cursorPosition.y}px, transparent 50%, black 100%)`,
                        maskPosition: '0 0',
                        WebkitMaskPosition: '0 0',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'destination-out',
                    }}
                />

                <EasterEggImage
                    isSolved={isSolved}
                    onClickEasterEgg={() => {
                        showOverlay && setSolved(true)
                        setShowOverlay(false)
                    }}
                />
            </div>

            <div className="pt-6">
                <Label size="large" weight="medium">
                    {isSolved && (
                        <div
                            className="flex flex-col gap-4"
                            ref={afterDeatilsRef}
                        >
                            <EasterEggDescription />
                        </div>
                    )}
                </Label>
            </div>

            <EasterEggSolved
                isSolved={isSolved}
                handleScroll={handleScroll}
                walletAddress={walletAddress || ''}
            />
        </MainContainer>
    )
}

const EasterEggDescription = () => {
    return (
        <>
            <HeadingText level={'h4'}>
                Unveil the Secrets of Superlend: Embark on a Journey to Unlock
                Hidden Easter Eggs!
            </HeadingText>
            <BodyText level={'body1'}>
                At Superlend, we blend innovation with fun.
            </BodyText>
            <BodyText level={'body1'}>
                Join SuperHunt—a thrilling quest for explorers and problem
                solvers eager to uncover hidden treasures and connect with the
                Superlend community.
            </BodyText>
            <HeadingText level={'h4'}>What&apos;s in the Hunt?</HeadingText>
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <BodyText level={'body1'}>
                        Hidden Easter Eggs: Discover clues scattered across the
                        Superlend platform, social media, and beyond. Each egg
                        unlocks secrets, rewards, and insights.
                    </BodyText>
                </li>
                <li>
                    <BodyText level={'body1'}>
                        Challenges: Solve riddles, complete tasks, and interact
                        with our platform to progress.
                    </BodyText>
                </li>
                <li>
                    <BodyText level={'body1'}>
                        Rewards: Gain exclusive insights, early access, badges,
                        and surprises as you advance through tiers.
                    </BodyText>
                </li>
            </ul>
            <HeadingText level={'h4'}>How to Join:</HeadingText>
            <ol className="list-decimal pl-5 space-y-2">
                <li>
                    <BodyText level={'body1'}>
                        Explore Superlend and hunt for Easter Eggs.
                    </BodyText>
                </li>
                <li>
                    <BodyText level={'body1'}>
                        Complete challenges and share your findings on social
                        media, also making sure you tag @SuperlendHQ to your
                        post.
                    </BodyText>
                </li>
                <li>
                    <BodyText level={'body1'}>
                        Unlock rewards, boost your knowledge of DeFi, and
                        connect with like-minded explorers.
                    </BodyText>
                </li>
            </ol>
            <BodyText level={'body1'}>
                This hunt isn&apos;t just about rewards—it&apos;s about
                learning, community, and being part of something bigger.
            </BodyText>
            <BodyText level={'body1'}>
                Ready to start? Dive in now and let the hunt begin! Follow us on
                Twitter, Discord, and other channels for hints and updates.
            </BodyText>
            <BodyText level={'body1'}>
                Good luck, explorers! #SuperHunt
            </BodyText>
        </>
    )
}

export default EasterEgg
