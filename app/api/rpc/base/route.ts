import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const baseRpcUrl = process.env.BASE_RPC_URL
        
        if (!baseRpcUrl) {
            return NextResponse.json(
                { error: 'BASE_RPC_URL environment variable is not configured' },
                { status: 500 }
            )
        }

        // Get the request body (RPC request)
        const body = await request.json()
        
        // Forward the request to the actual BASE RPC endpoint
        const response = await fetch(baseRpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error(`RPC request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        // Return the RPC response
        return NextResponse.json(data)
    } catch (error) {
        console.error('Base RPC proxy error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
