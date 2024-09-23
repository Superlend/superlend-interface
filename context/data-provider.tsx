"use client"

import useGetChainsData from '@/hooks/useGetChainsData';
import useGetTokensData from '@/hooks/useGetTokensData';
import { createContext } from 'react';

export const AssetsDataContext = createContext<any>(null);

export default function AssetsDataProvider({ children }: { children: React.ReactNode }) {
    const { data: allTokensData } = useGetTokensData();
    const { data: allChainsData } = useGetChainsData();

    return (
        <AssetsDataContext.Provider value={{ allChainsData, allTokensData }}>
            {children}
        </AssetsDataContext.Provider>
    )
}