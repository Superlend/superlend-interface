'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BodyText, HeadingText } from '@/components/ui/typography'
import { AlertTriangle, TrendingUp, Shield, Info } from 'lucide-react'
import InfoTooltip from '@/components/tooltips/InfoTooltip'

export default function LoopEducationSection() {
    return (
        <div className="loop-education-section flex flex-col gap-4">
            {/* High Risk Warning Card */}
            <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <HeadingText level="h5" weight="medium" className="text-yellow-800">
                                    High Risk Strategy
                                </HeadingText>
                                <Badge variant="yellow" className="text-xs">
                                    Advanced
                                </Badge>
                            </div>
                            <BodyText level="body2" className="text-yellow-700">
                                Leveraged looping is a high-risk strategy that can amplify both gains and losses. 
                                You risk liquidation if the market moves against your position. Ensure you understand 
                                the risks and only invest what you can afford to lose.
                            </BodyText>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* How Looping Works */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <HeadingText level="h5" weight="medium" className="text-gray-800">
                                How Loop Positions Work
                            </HeadingText>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                                        1
                                    </div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        Supply Collateral
                                    </BodyText>
                                </div>
                                <BodyText level="body3" className="text-gray-600 ml-8">
                                    Deposit your initial asset as collateral
                                </BodyText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                                        2
                                    </div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        Borrow & Swap
                                    </BodyText>
                                </div>
                                <BodyText level="body3" className="text-gray-600 ml-8">
                                    Borrow against collateral and swap to more collateral
                                </BodyText>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                                        3
                                    </div>
                                    <BodyText level="body2" weight="medium" className="text-gray-800">
                                        Repeat & Amplify
                                    </BodyText>
                                </div>
                                <BodyText level="body3" className="text-gray-600 ml-8">
                                    Repeat process to increase exposure and yield
                                </BodyText>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Concepts */}
            <Card className="bg-white bg-opacity-40">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <HeadingText level="h5" weight="medium" className="text-gray-800">
                                Key Concepts to Understand
                            </HeadingText>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            Health Factor
                                        </BodyText>
                                        <InfoTooltip content="A numeric representation of the safety of your position. Below 1.0 means liquidation risk." />
                                    </div>
                                    <BodyText level="body3" className="text-gray-600">
                                        Keep above 1.0 to avoid liquidation
                                    </BodyText>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            Leverage Multiplier
                                        </BodyText>
                                        <InfoTooltip content="How much your exposure is amplified. Higher leverage = higher risk and potential rewards." />
                                    </div>
                                    <BodyText level="body3" className="text-gray-600">
                                        Amplifies both gains and losses
                                    </BodyText>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            Net APY
                                        </BodyText>
                                        <InfoTooltip content="Your actual earning rate after accounting for borrowing costs and leverage." />
                                    </div>
                                    <BodyText level="body3" className="text-gray-600">
                                        Real return after borrowing costs
                                    </BodyText>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <BodyText level="body2" weight="medium" className="text-gray-800">
                                            Liquidation Risk
                                        </BodyText>
                                        <InfoTooltip content="Risk of your position being automatically closed if collateral value drops too much." />
                                    </div>
                                    <BodyText level="body3" className="text-gray-600">
                                        Monitor market conditions closely
                                    </BodyText>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 