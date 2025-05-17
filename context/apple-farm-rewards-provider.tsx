"use client"

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useGetMerklOpportunitiesData } from '@/hooks/useGetMerklOpportunitiesData';
import { ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS } from '@/constants';

interface AppleFarmRewardsContextProps {
    hasAppleFarmRewards: (tokenAddress: string) => boolean;
    appleFarmRewardsAprs: Record<string, number | undefined>;
    isLoading: boolean;
}

const AppleFarmRewardsContext = createContext<AppleFarmRewardsContextProps | undefined>(undefined);

interface AppleFarmRewardsProviderProps {
    children: ReactNode;
}

export const AppleFarmRewardsProvider: React.FC<AppleFarmRewardsProviderProps> = ({ children }) => {
    const { data: mBasisOpportunityData, isLoading: isLoadingMBasisOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0xb3509a79b1715bc7666666fc9c27eb77762436648de827a5c5817371593aefd0', // mBasis
        });
    const { data: mTBillOpportunityData, isLoading: isLoadingMTBillOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0xd8d0ad6579284bcb4dbc3fb1e40f4596c788e4508daf9cfd010459ce86832850', // mTBill
        });
    const { data: xtzOpportunityData, isLoading: isLoadingXTZOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0x2bd98414a5af5dae4a8370a2d59869ce4c1b204a9bd4236d3007617f93625303', // xtz
        });
    const { data: usdcOpportunityData, isLoading: isLoadingUSDCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0xb41a8ffef4c790d0f25c55a15f29b81b2c9fff9c07fd4999854ccb7fb3301d6b', // usdc
        });
    const { data: wbtcOpportunityData, isLoading: isLoadingWBTCCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0x3e262731bc9ef328fd1222b1164ff27f4fa46c02dde254257e0ae1164ebe1acd', // wbtc
        });
    const { data: usdtOpportunityData, isLoading: isLoadingUSDTCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0x4dd6b7595b1612465e25a8a5ec8ce7c9750f5211f0ebe120ffad71ada8a9b3e9', // usdt
        });
    const { data: wethOpportunityData, isLoading: isLoadingWETHOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0x5571b243f36c4320559aaf8c61e116d8271060b8db28cb90871c5ec8ed665ab0', // weth
        });

    const isLoading =
        isLoadingMBasisOpportunityData ||
        isLoadingMTBillOpportunityData ||
        isLoadingXTZOpportunityData ||
        isLoadingUSDCOpportunityData ||
        isLoadingWBTCCOpportunityData ||
        isLoadingUSDTCOpportunityData ||
        isLoadingWETHOpportunityData;

    const appleFarmRewardsAprs = useMemo(() => {
        return {
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['mBasis']]: mBasisOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['mTBill']]: mTBillOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['xtz']]: xtzOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['usdc']]: usdcOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['wbtc']]: wbtcOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['usdt']]: usdtOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['weth']]: wethOpportunityData?.[0]?.Opportunity?.apr,
        };
    }, [
        mBasisOpportunityData,
        mTBillOpportunityData,
        xtzOpportunityData,
        usdcOpportunityData,
        wbtcOpportunityData,
        usdtOpportunityData,
        wethOpportunityData,
    ]);

    const hasAppleFarmRewards = (tokenAddress: string) => Object.values(ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS).includes(tokenAddress)

    const value = {
        hasAppleFarmRewards,
        appleFarmRewardsAprs,
        isLoading,
    };

    return (
        <AppleFarmRewardsContext.Provider value={value}>
            {children}
        </AppleFarmRewardsContext.Provider>
    );
};

export const useAppleFarmRewards = () => {
    const context = useContext(AppleFarmRewardsContext);
    if (context === undefined) {
        throw new Error('useAppleFarmRewards must be used within an AppleFarmRewardsProvider');
    }
    return context;
};