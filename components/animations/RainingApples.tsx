'use client'

import React, { useMemo } from 'react';
import Image from 'next/image';

const RainingApples = () => {
    const apples = useMemo(() => {
        return Array.from({ length: 200 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 3,
            size: 32 + Math.random() * 8,
            rotationSpeed: 0.5 + Math.random() * 1,
        }));
    }, []);

    return (
        <div 
            className="fixed inset-0 overflow-hidden pointer-events-none z-[9999]"
            style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d'
            }}
        >
            {apples.map((apple) => (
                <div
                    key={apple.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${apple.left}%`,
                        top: '-50px',
                        width: `${apple.size}px`,
                        height: `${apple.size}px`,
                        animationDelay: `${apple.delay}s`,
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                    }}
                >
                    <div 
                        className="w-full h-full animate-spin"
                        style={{
                            animationDelay: `${apple.delay}s`,
                        }}
                    >
                        <Image
                            src="/images/logos/apple-green.png"
                            alt="falling apple"
                            fill
                            className="object-contain"
                            priority
                            sizes={`${apple.size}px`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RainingApples; 

// const RainingApples = () => {
//     const apples = Array.from({ length: 20 }, (_, i) => ({
//         id: i,
//         left: `${Math.random() * 100}%`,
//         delay: `${Math.random() * 3}s`,
//         size: 16 + Math.random() * 8,
//     }));

//     return (
//         <div className="absolute inset-0 overflow-hidden pointer-events-none group-hover:[&>div>div>img]:scale-150 transition-all duration-300">
//             {apples.map((apple) => (
//                 <div
//                     key={apple.id}
//                     className="absolute animate-fall"
//                     style={{
//                         left: apple.left,
//                         top: '-30px',
//                         animationDelay: apple.delay,
//                     }}
//                 >
//                     <div className="animate-spin">
//                         <Image
//                             src="/images/logos/apple-green.png"
//                             alt="falling apple"
//                             width={apple.size}
//                             height={apple.size}
//                             className="object-contain transition-transform duration-300"
//                         />
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// };