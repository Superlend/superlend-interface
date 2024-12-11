'use client';

import useGetPlatformData from "@/hooks/useGetPlatformData";
import useGetPlatformHistoryData from "@/hooks/useGetPlatformHistoryData";
import { TPlatform } from "@/types/platform";
import { Period } from "@/types/periodButtons";
import { useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

export type TPositionManagementContext = {
  platformData: TPlatform;
  isLoadingPlatformData: boolean;
  isErrorPlatformData: boolean;
  platformHistoryData: any;
  isLoadingPlatformHistory: boolean;
  isErrorPlatformHistory: boolean;
};

const PlatformDataInit: TPlatform = {
  platform: {
    name: '',
    platform_name: '',
    protocol_identifier: '',
    // protocol_type: "aaveV3",
    protocol_type: 'aaveV3',
    logo: '',
    chain_id: 0,
    vaultId: '',
    isVault: false,
    morpho_market_id: '',
    core_contract: '',
  },
  assets: [],
};

export const PositionManagementContext = createContext<TPositionManagementContext>({
  platformData: PlatformDataInit,
  isLoadingPlatformData: true,
  isErrorPlatformData: false,
  platformHistoryData: [],
  isLoadingPlatformHistory: true,
  isErrorPlatformHistory: false,
});

export default function PositionManagementProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const chain_id = searchParams.get('chain_id');
  const protocol_identifier = searchParams.get('protocol_identifier') || '';
  const tokenAddress = searchParams.get('token') || '';

  // [API_CALL: GET] - Get Platform data
  const {
    data: platformData,
    isLoading: isLoadingPlatformData,
    isError: isErrorPlatformData,
  } = useGetPlatformData({
    protocol_identifier,
    chain_id: Number(chain_id),
  });

  // [API_CALL: GET] - Get Platform history data
  const {
    data: platformHistoryData,
    isLoading: isLoadingPlatformHistory,
    isError: isErrorPlatformHistory,
  } = useGetPlatformHistoryData({
    protocol_identifier,
    token: tokenAddress,
    period: Period.oneDay,
  });

  return (
    <PositionManagementContext.Provider
      value={{
        platformData,
        platformHistoryData,
        isLoadingPlatformData,
        isLoadingPlatformHistory,
        isErrorPlatformData,
        isErrorPlatformHistory,
      }}
    >
      {children}
    </PositionManagementContext.Provider>
  );
}

export const usePositionManagementContext = () => {
  return useContext(PositionManagementContext);
};
