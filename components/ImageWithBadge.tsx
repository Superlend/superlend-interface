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
        height: `max-h-[${mainImgHeight || 20}px]`,
        width: `max-w-[${mainImgWidth || 20}px]`,
    }

    return (
        <span className='relative shrink-0'>
            <ImageWithDefault
                src={mainImg}
                alt={mainImgAlt}
                width={mainImgWidth || 20}
                height={mainImgHeight || 20}
                className={`relative rounded-full shrink-0 object-contain ${mainImgSizes.width} ${mainImgSizes.height}`}
            />
            <ImageWithDefault
                src={badgeImg}
                alt={badgeImgAlt}
                width={badgeImgWidth || 12}
                height={badgeImgHeight || 12}
                className="absolute bottom-[-6px] right-[-3px] bg-gray-100 rounded-full ring-2 ring-white max-w-[12px] max-h-[12px] object-contain"
            />
        </span>
    )
}
