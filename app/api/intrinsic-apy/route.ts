import { NextRequest, NextResponse } from 'next/server'

interface LombardApyResponse {
    lbtc_estimated_apy: number
}

interface IntrinsicApyResponse {
    success: boolean
    data: {
        // mBasisAPY: string
        // mTbillAPY: string
        // stXTZ: string
        // mMEV: string
        lbtcApyEstimated?: number // Add LBTC APY to existing structure
    }
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

export async function GET(request: NextRequest) {
    try {
        const startTime = performance.now()

        // Fetch data from both APIs in parallel
        const [lombardResponse] = await Promise.allSettled([
            fetch(
                'https://mainnet.prod.lombard.finance/api/v1/analytics/estimated-apy',
                {
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'Superlend/1.0',
                    },
                }
            ),
            // fetch('https://markets.superlend.xyz/api/intrinsic-apy/', {
            //     headers: {
            //         'Accept': 'application/json',
            //         'User-Agent': 'Superlend/1.0'
            //     }
            // })
        ])

        const endTime = performance.now()
        const responseTimeMs = Math.round(endTime - startTime)

        // Initialize response structure based on existing API
        const response: IntrinsicApyResponse = {
            success: true,
            data: {
                // mBasisAPY: '0',
                // mTbillAPY: '0',
                // stXTZ: '0',
                // mMEV: '0',
                lbtcApyEstimated: 0,
            },
            metadata: {
                timestamp: new Date().toISOString(),
                responseTimeMs,
                cached: {
                    // midas: false,
                    // stacy: false,
                    lombard: false,
                },
                rateLimited: {
                    // midas: false,
                    // stacy: false,
                    lombard: false,
                },
                errors: {
                    // midas: null,
                    // stacy: null,
                    lombard: null,
                },
                cacheInfo: {
                    // midasCacheTTL: '5 minutes',
                    // stacyCacheTTL: '5 minutes',
                    lombardCacheTTL: '5 minutes',
                },
            },
        }

        // Process Lombard API response
        if (
            lombardResponse.status === 'fulfilled' &&
            lombardResponse.value.ok
        ) {
            try {
                const lombardData: LombardApyResponse =
                    await lombardResponse.value.json()
                // Convert to percentage and add to response
                response.data.lbtcApyEstimated =
                    lombardData.lbtc_estimated_apy * 100
                response.metadata.cached.lombard = false
            } catch (error) {
                console.error('Error parsing Lombard API response:', error)
                response.metadata.errors.lombard =
                    'Failed to parse Lombard API response'
                response.data.lbtcApyEstimated = 0
            }
        } else {
            console.error(
                'Lombard API request failed:',
                lombardResponse.status === 'fulfilled'
                    ? lombardResponse.value.status
                    : lombardResponse.reason
            )
            response.metadata.errors.lombard =
                lombardResponse.status === 'fulfilled'
                    ? `HTTP ${lombardResponse.value.status}`
                    : 'Network error'
            response.data.lbtcApyEstimated = 0
        }

        // Process existing intrinsic API response
        // if (existingIntrinsicResponse.status === 'fulfilled' && existingIntrinsicResponse.value.ok) {
        //     try {
        //         const existingData = await existingIntrinsicResponse.value.json()
        //         if (existingData.success && existingData.data) {
        //             response.data.mBasisAPY = existingData.data.mBasisAPY || "0"
        //             response.data.mTbillAPY = existingData.data.mTbillAPY || "0"
        //             response.data.stXTZ = existingData.data.stXTZ || "0"
        //             response.data.mMEV = existingData.data.mMEV || "0"

        //             // Copy over existing metadata if available
        //             if (existingData.metadata) {
        //                 response.metadata.cached.midas = existingData.metadata.cached?.midas || false
        //                 response.metadata.cached.stacy = existingData.metadata.cached?.stacy || false
        //                 response.metadata.rateLimited.midas = existingData.metadata.rateLimited?.midas || false
        //                 response.metadata.rateLimited.stacy = existingData.metadata.rateLimited?.stacy || false
        //                 response.metadata.errors.midas = existingData.metadata.errors?.midas || null
        //                 response.metadata.errors.stacy = existingData.metadata.errors?.stacy || null
        //             }
        //         }
        //     } catch (error) {
        //         console.error('Error parsing existing intrinsic API response:', error)
        //         response.metadata.errors.midas = 'Failed to parse existing API response'
        //     }
        // } else {
        //     console.error('Existing intrinsic API request failed:', existingIntrinsicResponse.status === 'fulfilled' ? existingIntrinsicResponse.value.status : existingIntrinsicResponse.reason)
        //     response.metadata.errors.midas = existingIntrinsicResponse.status === 'fulfilled'
        //         ? `HTTP ${existingIntrinsicResponse.value.status}`
        //         : 'Network error'
        // }

        //         console.log(`🚀 INTRINSIC APY API RESPONSE 🚀
        // ┌─────────────────────────────────────────────────────────────┐
        // │ Processing Time: ${responseTimeMs}ms
        // │ LBTC APY: ${response.data.lbtcApyEstimated}%
        // │ mBasisAPY: ${response.data.mBasisAPY}%
        // │ mTbillAPY: ${response.data.mTbillAPY}%
        // │ Lombard Error: ${response.metadata.errors.lombard || 'None'}
        // │ Existing API Error: ${response.metadata.errors.midas || 'None'}
        // │ Timestamp: ${response.metadata.timestamp}
        // └─────────────────────────────────────────────────────────────┘`)

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=300', // 5 minutes cache
                'Content-Type': 'application/json',
            },
        })
    } catch (error) {
        console.error('Error in intrinsic APY API:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                data: {
                    lbtcApyEstimated: 0,
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    responseTimeMs: 0,
                    cached: { lombard: false },
                    rateLimited: { lombard: false },
                    errors: { lombard: 'Internal error' },
                    cacheInfo: { lombardCacheTTL: '5 minutes' },
                },
            },
            { status: 500 }
        )
    }
}
