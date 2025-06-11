import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()
    // if (url.pathname === '/') {
    //     url.pathname = '/discover' // Set your desired default route here
    //     return NextResponse.redirect(url)
    // }

    const isVaildUserEasterEgg =
        request.cookies.get('accessEasterEgg')?.value === 'true'
    if (!isVaildUserEasterEgg && url.pathname === '/super-hunt') {
        url.pathname = '/discover'
        return NextResponse.redirect(url)
    }

    // Define allowed origins
    const allowedOrigins = ['https://app.superlend.xyz', 'https://deploy-preview-119--superlend.netlify.app'];
    
    // In development mode, allow localhost
    if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:3000');
    }
    
    const origin = request.headers.get('origin');
    
    // Check if the request is from an allowed origin
    if (origin && !allowedOrigins.includes(origin)) {
        console.log(`Blocked request from unauthorized origin: ${origin}`);
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Unauthorized origin' }),
            {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    return NextResponse.next()
}

// Specify which routes this middleware applies to
export const config = {
    matcher: ['/api/telegram-connect', '/api/telegram-check', '/api/discord-connect', '/api/discord-check', '/api/rpc-proxy', '/api/csrf-token'],
};
