import React from 'react'
import Image from 'next/image'

interface DoubleImageProps {
    src1: string
    src2: string
    size?: number
}

const DoubleImage: React.FC<DoubleImageProps> = ({
    src1,
    src2,
    size = 24,
}) => {
    return (
        <div className="flex items-center">
            <Image
                src={src1}
                alt="token 1"
                width={size}
                height={size}
                className="rounded-full"
            />
            <Image
                src={src2}
                alt="token 2"
                width={size}
                height={size}
                className="-ml-2 rounded-full"
            />
        </div>
    )
}

export default DoubleImage 