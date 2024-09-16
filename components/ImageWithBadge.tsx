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
            <img src={mainImg} alt={mainImgAlt || ""} width={mainImgWidth || 20} height={mainImgHeight || 20} />
            <img src={badgeImg} alt={badgeImgAlt || ""} width={badgeImgWidth || 12} height={badgeImgHeight || 12}
                className="absolute"
                style={{ bottom: "-3px", right: "-2px" }} />
        </span>
    )
}
