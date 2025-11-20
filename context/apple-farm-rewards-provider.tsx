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

const APPLE_FARM_REWARDS_CAMPAIGN_IDS = {
    MBASIS: '0x33dbc542d62fef31c95a8278f415b47b087186d40bb364451cbb399ec3514de0',
    MTBill: '0x1ca455114be0e0264504f91192dbd86c2d94d509cb9d0ba5331b618952eec508',
    XTZ: '0x9ff64e9c2101667cb808bf9a179662c6174859bb4c6a7842e58b0e06617a482b',
    USDC: '0x0c5c25453fbfba679d472140ad0c21531b5dcd1dbe98067c0058076d98d36990',
    WBTC: '0x6948b7f6c9bf96c9ce1ece370059b032587e10c1feabc71a3b5f04bf1b5ee691',
    USDT: '0x134d2ae337e986c8acec6828777b027b44c400ad4322882628e48a1dd3679def',
    LBTC: '0x0a913953bba88c4877169d8599ec9c14892e6a67b60d37800c7dca42f077a465'
}

export const AppleFarmRewardsProvider: React.FC<AppleFarmRewardsProviderProps> = ({ children }) => {
    const { data: mBasisOpportunityData, isLoading: isLoadingMBasisOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.MBASIS,
        });
    const { data: mTBillOpportunityData, isLoading: isLoadingMTBillOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.MTBill,
        });
    const { data: xtzOpportunityData, isLoading: isLoadingXTZOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.XTZ,
        });
    const { data: usdcOpportunityData, isLoading: isLoadingUSDCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.USDC,
        });
    const { data: wbtcOpportunityData, isLoading: isLoadingWBTCCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.WBTC,
        });
    const { data: usdtOpportunityData, isLoading: isLoadingUSDTCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.USDT,
        });
    // const { data: wethOpportunityData, isLoading: isLoadingWETHOpportunityData } =
    //     useGetMerklOpportunitiesData({
    //         campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.WETH,
    //     });
    const { data: lbtcOpportunityData, isLoading: isLoadingLBTCCOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.LBTC,
        });

    const isLoading =
        isLoadingMBasisOpportunityData ||
        isLoadingMTBillOpportunityData ||
        isLoadingXTZOpportunityData ||
        isLoadingUSDCOpportunityData ||
        isLoadingWBTCCOpportunityData ||
        isLoadingUSDTCOpportunityData ||
        isLoadingLBTCCOpportunityData
        // isLoadingWETHOpportunityData;

    const appleFarmRewardsAprs = useMemo(() => {
        return {
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['mBasis']]: mBasisOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['mTBill']]: mTBillOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['xtz']]: xtzOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['usdc']]: usdcOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['wbtc']]: wbtcOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['usdt']]: usdtOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['lbtc']]: lbtcOpportunityData?.[0]?.Opportunity?.apr,
            // [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['weth']]: wethOpportunityData?.[0]?.Opportunity?.apr,
        };
    }, [
        mBasisOpportunityData,
        mTBillOpportunityData,
        xtzOpportunityData,
        usdcOpportunityData,
        wbtcOpportunityData,
        usdtOpportunityData,
        lbtcOpportunityData,
        // wethOpportunityData,
    ]);

    const hasAppleFarmRewards = (tokenAddress: string) => (Object.values(ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS).includes(tokenAddress))

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