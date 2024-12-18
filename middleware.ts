import { NextResponse } from 'next/server'

export function middleware(request: any) {
    const url = request.nextUrl.clone()
    if (url.pathname === '/') {
        url.pathname = '/discover' // Set your desired default route here
        return NextResponse.redirect(url)
    }
    return NextResponse.next()
}
