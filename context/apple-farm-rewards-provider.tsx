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
    MBASIS: '0x6cf5b800dcc169a204dbe9c57473451e7932492ef33f669c6f625a8c66a7c113',
    MTBill: '0x0c1fe667229297f48bb64b0d3c55c635cdb11219d1b13c3c86008fe533beca32',
    XTZ: '0xaf113e08f8637ec1bc6a02e56313997122ceae1ef748e51a07fc9e5a433f8078',
    USDC: '0x277f8148036e308edf2509097b684304adeee739c143cc5b0ecf39349c73014b',
    WBTC: '0x95ccc4921e1144fedb0e375e1b626992808fad4e311f835ddbc8b2b74f731317',
    USDT: '0x63dbd3b41b8bed5a4adea2667a676e8573acb404820476326f2c865102741d7c',
    WETH: '0x6d56c14a8d440c2b77b706726514cd3d939066c416394d2bb61a0b1412159418',
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