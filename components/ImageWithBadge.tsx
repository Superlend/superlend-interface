import React from 'react';
import ImageWithDefault from './ImageWithDefault';

interface IProps {
    mainImg: string;
    badgeImg: string;
    mainImgWidth?: string;
    badgeImgWidth?: string;
    mainImgHeight?: string;
    badgeImgHeight?: string;
    mainImgAlt?: string;
    badgeImgAlt?: string;
}

export default function ImageWithBadge({
    mainImg,
    badgeImg,
    mainImgWidth,
    badgeImgWidth,
    mainImgHeight,
    badgeImgHeight,
    mainImgAlt,
    badgeImgAlt
}: IProps) {
    const mainImgSizes = {
        width: mainImgWidth || 20,
        height: mainImgHeight || 20,
        className: `max-w-[${mainImgWidth || 20}px] max-h-[${mainImgHeight || 20}px]`
    }
    const badgeImgSizes = {
        width: badgeImgWidth || 12,
        height: badgeImgHeight || 12,
        className: `max-w-[${badgeImgWidth || 12}px] max-h-[${badgeImgHeight || 12}px]`
    }
    
    return (
        <span className='relative shrink-0'>
            <ImageWithDefault
                src={mainImg}
                alt={mainImgAlt}
                width={mainImgSizes.width}
                height={mainImgSizes.height}
                className={`relative rounded-full shrink-0 object-contain ${mainImgSizes.className}`}
            />
            <ImageWithDefault
                src={badgeImg}
                alt={badgeImgAlt}
                width={badgeImgSizes.width}
                height={badgeImgSizes.height}
                className={`absolute bottom-[-6px] right-[-3px] bg-gray-100 rounded-full ring-2 ring-white ${badgeImgSizes.className} object-contain`}
            />
        </span>
    )
}
