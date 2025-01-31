"use client"

import React from 'react'
// import { FeedbackFormDialog } from './feedback-form-dialog'
import { FeedbackBanner } from './feedback-banner'
import Container from './Container'
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    if (isHomePage) {
        return null;
    }

    return (
        <footer className="w-full h-full">
            <Container>
                <FeedbackBanner />
            </Container>
        </footer>
    )
}
