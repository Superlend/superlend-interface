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
    MBASIS: '0x9791b3456f84250db23c3b70182881d8d971f7549bd6d5fef9a43a4cc13f888e',
    MTBill: '0x1ca455114be0e0264504f91192dbd86c2d94d509cb9d0ba5331b618952eec508',
    XTZ: '0xaeec3936c28d13cac746ab3d97997f838905d6e1d789b871a5f31187e3745c22',
    USDC: '0x1ca28225817aef341933e9ea1e09228d5b5ca3e1c1bb8c3281a5b2c225849238',
    WBTC: '0x46cd8f91631692117fe8a1a993b5693940da473f48086415bfb8efb669dcdd4f',
    USDT: '0xbebb1d216e5681060e35fc7e54dfbc6ec43bec52723e9afd1f262e187242bb94',
    // WETH: '0xd1cc7c4f0734f461cd74b65d163d65960760e57631016bc6bf0269f13212c40f',
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

    const isLoading =
        isLoadingMBasisOpportunityData ||
        isLoadingMTBillOpportunityData ||
        isLoadingXTZOpportunityData ||
        isLoadingUSDCOpportunityData ||
        isLoadingWBTCCOpportunityData ||
        isLoadingUSDTCOpportunityData
        // isLoadingWETHOpportunityData;

    const appleFarmRewardsAprs = useMemo(() => {
        return {
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['mBasis']]: mBasisOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['mTBill']]: mTBillOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['xtz']]: xtzOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['usdc']]: usdcOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['wbtc']]: wbtcOpportunityData?.[0]?.Opportunity?.apr,
            [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['usdt']]: usdtOpportunityData?.[0]?.Opportunity?.apr,
            // [ELIGIBLE_TOKENS_FOR_APPLE_FARM_REWARDS['weth']]: wethOpportunityData?.[0]?.Opportunity?.apr,
        };
    }, [
        mBasisOpportunityData,
        mTBillOpportunityData,
        xtzOpportunityData,
        usdcOpportunityData,
        wbtcOpportunityData,
        usdtOpportunityData,
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