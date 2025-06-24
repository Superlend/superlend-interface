'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type ImageWithDefaultProps = {
    src: string
    defaultSrc?: string
    alt: string
    className?: string
    width: number
    height: number
}

const ImageWithDefault = ({
    src,
    defaultSrc = '/images/fallback-img.png',
    alt = '',
    className = '',
    width,
    height,
    ...props
}: any) => {
    const [imageSrc, setImageSrc] = useState(src || defaultSrc)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        if (src && src !== imageSrc && !hasError) {
            setImageSrc(src)
            setHasError(false)
        } else if (!src) {
            setImageSrc(defaultSrc)
        }
    }, [src, defaultSrc, imageSrc, hasError])

    const handleError = () => {
        if (imageSrc !== defaultSrc) {
            setImageSrc(defaultSrc)
            setHasError(true)
        }
    }

    const handleLoad = () => {
        setHasError(false)
    }

    return (
        <Image
            className={`${className} ${hasError ? 'opacity-60' : ''}`}
            width={width}
            height={height}
            src={imageSrc}
            onError={handleError}
            onLoad={handleLoad}
            alt={alt}
            style={{
                minWidth: width ? `${width}px` : undefined,
                minHeight: height ? `${height}px` : undefined,
                maxWidth: width ? `${width}px` : undefined,
                maxHeight: height ? `${height}px` : undefined,
                objectFit: 'contain',
                ...props.style
            }}
            {...props}
        />
    )
}

export default ImageWithDefault
