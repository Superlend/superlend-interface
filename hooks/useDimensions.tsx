'use client';

import { useLayoutEffect, useState } from 'react';

type DimensionsType = {
  width: number;
  height: number;
};

const dimensionsInit = {
  height: 0,
  width: 0,
};

export default function useDimensions() {
  const [dimensions, setDimensions] = useState<DimensionsType>(dimensionsInit);

    useLayoutEffect(() => {
        const updateDimensions = function () {
            const { innerWidth, innerHeight } = window;

            setDimensions({
                width: innerWidth,
                height: innerHeight,
            });
        };

        updateDimensions();

        window.addEventListener("resize", updateDimensions);

        return () => {
            window.removeEventListener("resize", updateDimensions);
        }
    }, []);

    return dimensions;
}
