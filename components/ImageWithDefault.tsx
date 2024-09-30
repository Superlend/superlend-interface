"use client";

import { useEffect, useState } from 'react';

const ImageWithDefault = ({ src, defaultSrc = '/images/fallback-img.png', alt, className, width, height }: any) => {
    const [imageSrc, setImageSrc] = useState(src);

    useEffect(() => {
        setImageSrc(src)
    }, [src])

    const handleError = () => {
        setImageSrc(defaultSrc);
    };

    return (
        <img
            className={className || ""}
            width={width}
            height={height}
            src={imageSrc}
            onError={handleError}
            alt={alt}
        />
    )
}

export default ImageWithDefault