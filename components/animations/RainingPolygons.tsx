'use client'

import React, { useMemo } from 'react';
import Image from 'next/image';

const RainingPolygons = () => {
    const polygons = useMemo(() => {
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
            {polygons.map((polygon) => (
                <div
                    key={polygon.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${polygon.left}%`,
                        top: '-50px',
                        width: `${polygon.size}px`,
                        height: `${polygon.size}px`,
                        animationDelay: `${polygon.delay}s`,
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                    }}
                >
                    <div 
                        className="w-full h-full animate-spin"
                        style={{
                            animationDelay: `${polygon.delay}s`,
                        }}
                    >
                        <Image
                            src="/images/chains/polygon.webp"
                            alt="falling polygon"
                            fill
                            className="object-contain"
                            priority
                            sizes={`${polygon.size}px`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RainingPolygons; 