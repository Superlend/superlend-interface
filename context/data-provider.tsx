"use client"

import useGetChainsData from '@/hooks/useGetChainsData';
import useGetTokensData from '@/hooks/useGetTokensData';
import { TChain, TToken } from '@/types';
import { createContext, useContext } from 'react';

type TAssetsDataProps = {
    allTokensData: any,
    allChainsData: TChain[]
};

export const AssetsDataContext = createContext<TAssetsDataProps>({
    allTokensData: [],
    allChainsData: []
});

export default function AssetsDataProvider({ children }: { children: React.ReactNode }) {
    const { data: allTokensData } = useGetTokensData();
    const { data: allChainsData } = useGetChainsData();

    return (
        <AssetsDataContext.Provider value={{ allChainsData, allTokensData }}>
            {children}
        </AssetsDataContext.Provider>
    )
}

export const useAssetsData = () => {
    const context = useContext(AssetsDataContext);
    if (!context) throw new Error('useAssetsData must be used within an AssetsDataProvider');
    return context;
}
