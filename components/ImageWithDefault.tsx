"use client";

import { useState } from 'react';

const ImageWithDefault = ({ src, defaultSrc = '/images/logos/favicon-32x32.png', alt, className, width, height }: any) => {
    const [imageSrc, setImageSrc] = useState(src);

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