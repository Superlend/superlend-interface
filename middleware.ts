import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    if (url.pathname === '/') {
        url.pathname = '/discover'; // Set your desired default route here
        return NextResponse.redirect(url);
    }

	const isVaildUserEasterEgg = request.cookies.get("accessEasterEgg")?.value === "true";
	if (!isVaildUserEasterEgg && url.pathname === "/easter-egg") {
		url.pathname = "/discover";
		return NextResponse.redirect(url);
	}

    return NextResponse.next();
}