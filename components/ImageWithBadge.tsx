import React from 'react';

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
    return (
        <span className='relative shrink-0'>
            <img
                src={mainImg || '/images/logos/favicon-32x32.png'}
                alt={mainImgAlt || ""}
                width={mainImgWidth || 20}
                height={mainImgHeight || 20}
            />
            <img
                src={badgeImg || '/images/icons/pie-chart.svg'}
                alt={badgeImgAlt || ""}
                width={badgeImgWidth || 12}
                height={badgeImgHeight || 12}
                className="absolute bg-gray-100 rounded-full ring-2 ring-white max-w-full max-h-full"
                style={{ bottom: "-6px", right: "-3px" }}
            />
        </span>
    )
}
