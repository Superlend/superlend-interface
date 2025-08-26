import { request } from './request'

export interface IntrinsicApyData {
    // mBasisAPY: string
    // mTbillAPY: string
    // stXTZ: string
    // mMEV: string
    lbtcApyEstimated?: number
}

export interface IntrinsicApyResponse {
    success: boolean
    data: IntrinsicApyData
    metadata: {
        timestamp: string
        responseTimeMs: number
        cached: {
            // midas: boolean
            // stacy: boolean
            lombard?: boolean
        }
        rateLimited: {
            // midas: boolean
            // stacy: boolean
            lombard?: boolean
        }
        errors: {
            // midas: null | string
            // stacy: null | string
            lombard?: null | string
        }
        cacheInfo: {
            // midasCacheTTL: string
            // stacyCacheTTL: string
            lombardCacheTTL?: string
        }
    }
}

export async function getIntrinsicApyData(): Promise<IntrinsicApyResponse> {
    // Use fetch directly to call our local Next.js API route
    const response = await fetch('/api/intrinsic-apy', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    
    if (!response.ok) {
        throw new Error(`Failed to fetch intrinsic APY data: ${response.status}`)
    }
    
    return response.json()
}
