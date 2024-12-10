"use client"

import useGetPortfolioData from "@/hooks/useGetPortfolioData";
import { TPositionType } from "@/types";
import { TChain } from "@/types/chain";
import { TPortfolio } from "@/types/queries/portfolio";
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { AssetsDataContext } from "./data-provider";

export type TPositionsFilters = {
    token_ids: string[],
    chain_ids: string[];
    platform_ids: string[];
    protocol_identifier?: string[];
}

export type TPositionsContext = {
    filters: TPositionsFilters,
    setFilters: Dispatch<SetStateAction<TPositionsFilters>>,
    positionType: TPositionType,
    setPositionType: Dispatch<SetStateAction<TPositionType>>,
    portfolioData: TPortfolio,
    isLoadingPortfolioData: boolean,
    isErrorPortfolioData: boolean,
}

const filtersInit = {
    token_ids: [],
    chain_ids: [],
    platform_ids: [],
    protocol_identifier: [],
}

const positionTypeInit: TPositionType = "lend";

const PortfolioDataInit = {
    platforms: [],
    total_borrowed: 0,
    total_supplied: 0,
};

export const PositionsContext = createContext<TPositionsContext>({
    filters: filtersInit,
    setFilters: () => { },
    positionType: positionTypeInit,
    setPositionType: () => { },
    portfolioData: PortfolioDataInit,
    isLoadingPortfolioData: false,
    isErrorPortfolioData: false,
});

export default function PositionsProvider({ children }: { children: React.ReactNode }) {
    const [positionType, setPositionType] = useState<TPositionType>(positionTypeInit);
    const [filters, setFilters] = useState<TPositionsFilters>(filtersInit);
    const [isLoadingPortfolioData, setIsLoadingPortfolioData] = useState<boolean>(false);
    const [isErrorPortfolioData, setIsErrorPortfolioData] = useState<boolean>(false);
    const [portfolioData, setPortfolioData] = useState<TPortfolio>(PortfolioDataInit);
    const { allChainsData } = useContext(AssetsDataContext);
    const activeAccount = useActiveAccount();
    const walletAddress = activeAccount?.address;
    const chainsIds = allChainsData.map((chain: TChain) => chain.chain_id);

    // get portfolio data for subset of chains (3 chains)
    const {
        data: portfolioData1,
        isLoading: isLoadingPortfolioData1,
        isError: isErrorPortfolioData1
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
        chain_id: chainsIds.slice(0, 3).map(String),
    });

    // get portfolio data for subset of chains (3 chains)
    const {
        data: portfolioData2,
        isLoading: isLoadingPortfolioData2,
        isError: isErrorPortfolioData2
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
        chain_id: chainsIds.slice(3, 6).map(String),
    });

    // get portfolio data for subset of chains (4 chains)
    const {
        data: portfolioData3,
        isLoading: isLoadingPortfolioData3,
        isError: isErrorPortfolioData3
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}` | undefined,
        chain_id: chainsIds.slice(6, 10).map(String),
    });

    // combine all portfolio data loading states
    useEffect(() => {
        setIsLoadingPortfolioData(isLoadingPortfolioData1 && isLoadingPortfolioData2 && isLoadingPortfolioData3);
    }, [isLoadingPortfolioData1, isLoadingPortfolioData2, isLoadingPortfolioData3]);

    // combine all portfolio data error states
    useEffect(() => {
        setIsErrorPortfolioData(isErrorPortfolioData1 || isErrorPortfolioData2 || isErrorPortfolioData3);
    }, [isErrorPortfolioData1, isErrorPortfolioData2, isErrorPortfolioData3]);

    // combine all portfolio data subsets
    useEffect(() => {
        setPortfolioData({
            ...portfolioData1,
            ...portfolioData2,
            ...portfolioData3
        });
    }, [portfolioData1, portfolioData2, portfolioData3]);

    return (
        <PositionsContext.Provider value={{
            filters,
            setFilters,
            positionType,
            setPositionType,
            portfolioData,
            isLoadingPortfolioData,
            isErrorPortfolioData
        }}>
            {children}
        </PositionsContext.Provider>
    )
}