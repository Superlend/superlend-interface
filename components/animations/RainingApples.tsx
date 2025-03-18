'use client'

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';

const RainingApples = () => {
    const [isAnimating, setIsAnimating] = useState(true);
    
    // Increased number of apples from 20 to 35
    const apples = useMemo(() => Array.from({ length: 200 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        size: 32 + Math.random() * 8,
        rotationSpeed: 0.5 + Math.random() * 1, // Random rotation speed between 2-4 seconds
    })), []);

    useEffect(() => {
        // Calculate total animation time: 
        // Base animation time (5s) + Maximum delay (3s) + Extra buffer (2s)
        const totalAnimationTime = (5 + 3 + 2) * 1000;
        
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, totalAnimationTime);

        return () => clearTimeout(timer);
    }, []);

    if (!isAnimating) return null;

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
                    style={{
                        position: 'absolute',
                        left: `${apple.left}%`,
                        top: '-50px',
                        width: `${apple.size}px`,
                        height: `${apple.size}px`,
                        '--fall-delay': `${apple.delay}s`,
                        animation: 'fall 5s linear forwards',
                        animationDelay: `var(--fall-delay)`,
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                    } as React.CSSProperties}
                >
                    <div 
                        style={{
                            width: '100%',
                            height: '100%',
                            animation: `spin ${apple.rotationSpeed}s linear infinite`,
                            animationDelay: `var(--fall-delay)`,
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