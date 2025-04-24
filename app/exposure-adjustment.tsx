'use client'

import { AssetTxWidget } from './position-management/tx-widgets'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ExposureAdjustmentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // If there's no token in the URL, redirect to a default token with exposure_widget=true
    useEffect(() => {
        if (!searchParams.get('token')) {
            // Example of redirect to a default token (replace with an actual token address)
            router.push('/exposure-adjustment?token=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599&chain_id=1&protocol_identifier=aave-v3&exposure_widget=true')
        }
    }, [searchParams])

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">Exposure Adjustment</h1>
            <div className="max-w-xl mx-auto">
                <AssetTxWidget />
            </div>
        </div>
    )
} 