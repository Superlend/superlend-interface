"use client"

import React, { useEffect, useState } from 'react'

export default function useIsClient() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return {
        isClient,
        setIsClient,
    }
}
