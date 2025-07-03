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
    MBASIS: '0xf21ca0bbc6dee4da47f35f1f8e3d88a9779e0e2ae8990392585fac6383671582',
    MTBill: '0xb89cfe220406f4cb039241b8070350794eb6c445f61ceb85e5f045277c0db18f',
    XTZ: '0xe272b94ede07948f5e11de40f588f9607b1d25f72a0a68ff21ce95e911ab3046',
    USDC: '0x22b1631a0811fe1a14ca2554bf05eab15df5a2b8adbc607cb7c5330f804a9e8d',
    WBTC: '0x15334bcb7b6a7d518f1ed2f57d23d0614ef540074e500600a31a72b36cd7fb67',
    USDT: '0x3fa208effe1df2d25b546c9094e172df02a861d95136524306e18eb36d97ae28',
    WETH: '0xd1cc7c4f0734f461cd74b65d163d65960760e57631016bc6bf0269f13212c40f',
}

export const AppleFarmRewardsProvider: React.FC<AppleFarmRewardsProviderProps> = ({ children }) => {
    const { data: mBasisOpportunityData, isLoading: isLoadingMBasisOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: '0xb3509a79b1715bc7666666fc9c27eb77762436648de827a5c5817371593aefd0', // mBasis
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
    const { data: wethOpportunityData, isLoading: isLoadingWETHOpportunityData } =
        useGetMerklOpportunitiesData({
            campaignId: APPLE_FARM_REWARDS_CAMPAIGN_IDS.WETH,
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