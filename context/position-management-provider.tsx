"use client";

import useGetPlatformData from "@/hooks/useGetPlatformData";
import { TPlatform } from "@/types";
import { useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

export type TPositionManagementContext = {
    platformData: TPlatform,
    isLoadingPlatformData: boolean,
    isErrorPlatformData: boolean,
}

const PlatformDataInit: TPlatform = {
    platform: {
        name: "",
        platform_name: "",
        protocol_identifier: "",
        platform_type: "aaveV3",
        logo: "",
        chain_id: 0,
        vaultId: "",
        isVault: false,
        morpho_market_id: "",
    },
    assets: [],
};

export const PositionManagementContext = createContext<TPositionManagementContext>({
    platformData: PlatformDataInit,
    isLoadingPlatformData: true,
    isErrorPlatformData: false,
});

export default function PositionManagementProvider({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const chain_id = searchParams.get("chain_id");
    const protocol_identifier = searchParams.get("protocol_identifier") || "";

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    });

    return (
        <PositionManagementContext.Provider value={{
            platformData,
            isLoadingPlatformData,
            isErrorPlatformData
        }}>
            {children}
        </PositionManagementContext.Provider>
    )
}

export const usePositionManagementContext = () => {
    return useContext(PositionManagementContext);
}

