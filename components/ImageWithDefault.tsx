'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type ImageWithDefaultProps = {
  src: string;
  defaultSrc?: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
};

const ImageWithDefault = ({
  src,
  defaultSrc = '/images/fallback-img.png',
  alt = '',
  className = '',
  width,
  height,
  ...props
}: any) => {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  const handleError = () => {
    setImageSrc(defaultSrc);
  };

  return (
    <Image
      className={className}
      width={width}
      height={height}
      src={imageSrc}
      onError={handleError}
      alt={alt}
      {...props}
    />
  );
};

export default ImageWithDefault;
