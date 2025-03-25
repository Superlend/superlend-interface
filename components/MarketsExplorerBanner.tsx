'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from './ui/card'
import { ArrowRightIcon, Sparkles } from 'lucide-react'
import { BodyText, HeadingText } from './ui/typography'
import ImageWithDefault from './ImageWithDefault'

interface MarketsExplorerBannerProps {
    className?: string
}

export default function MarketsExplorerBanner({ className }: MarketsExplorerBannerProps) {
    const [showAllMarkets, setShowAllMarkets] = useState<boolean>(false)

    useEffect(() => {
        // Get the value from localStorage
        const showAllMarketsValue = localStorage.getItem('show_all_markets')
        setShowAllMarkets(showAllMarketsValue === 'true')
    }, [])

    return (
        <Link
            href={showAllMarkets ? "/etherlink?chain_ids=42793" : "/discover"}
            onClick={() => {
                localStorage.setItem('show_all_markets', showAllMarkets ? 'false' : 'true')
            }}
            className={className}
        >
            <Card
                className={`
                    relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group
                    ${showAllMarkets
                        ? 'bg-gradient-to-br from-[#F5FFF7] via-[#EDFBEF] to-[#00985b]'
                        : 'bg-[#F1FF52]'
                    }
                    before:absolute before:inset-0 before:bg-[url('/images/grid-pattern.svg')] before:opacity-5 before:bg-repeat
                    after:absolute after:inset-0 ${!showAllMarkets ? 'after:bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] after:opacity-100' : 'after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent after:opacity-0 hover:after:opacity-100'}
                    after:transition-opacity after:duration-500
                `}
            >
                {/* Decorative circles */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-3xl" />

                <div className="relative flex items-center justify-between p-6 gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                            {!showAllMarkets && <Sparkles className={`w-5 h-5 text-[#2A2826] fill-current pt-1`} />}
                            {showAllMarkets && <ImageWithDefault src="/images/logos/apple-green.png" alt="Apple Farm Logo" width={20} height={20} className="w-5 h-5" />}
                            <BodyText
                                level="body2"
                                weight="medium"
                                className={`${showAllMarkets ? 'text-gray-800' : 'text-[#2A2826]'}`}
                            >
                                {showAllMarkets
                                    ? "3 Million in rewards on Etherlink"
                                    : "Explore 350+ markets across 15+ chains"
                                }
                            </BodyText>
                        </div>
                        {/* <BodyText
                            level="body2"
                            className={`${showAllMarkets ? 'text-gray-600' : 'text-white/80'} max-w-[80%]`}
                        >
                            {showAllMarkets
                                ? "Join Etherlink's incentive program and earn rewards"
                                : "Find the best lending and borrowing opportunities"
                            }
                        </BodyText> */}
                    </div>
                    <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full shrink-0 
                        ${showAllMarkets
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-white/50 text-[#2A2826]'
                        }
                        group-hover:scale-110 transition-transform duration-300
                    `}>
                        <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                </div>
            </Card>
        </Link>
    )
}