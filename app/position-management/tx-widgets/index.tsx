"use client"

import LoadingSectionSkeleton from "@/components/skeletons/LoadingSection"
import { FC } from "react"
import { PlatformType } from "@/types/platform"
import useGetPlatformData from "@/hooks/useGetPlatformData"
import { useSearchParams } from "next/navigation"
import { TPositionType } from "@/types"
import useGetPortfolioData from "@/hooks/useGetPortfolioData"
import { useWalletConnection } from "@/hooks/useWalletConnection"
import AaveV3TxWidget from "./aave-tx-widget"
import MorphoTxWidget from "./morpho-tx-widget"
import FluidTxWidget from "./fluid-tx-widget"

export const AssetTxWidget: FC = () => {
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const positionTypeParam: TPositionType = (searchParams.get('position_type') as TPositionType) || 'lend'
    const { walletAddress, handleSwitchChain, isWalletConnected, isConnectingWallet } = useWalletConnection()

    // [API_CALL: GET] - Get Platform data
    const {
        data: platformData,
        isLoading: isLoadingPlatformData,
        isError: isErrorPlatformData,
    } = useGetPlatformData({
        protocol_identifier,
        chain_id: Number(chain_id),
    })

    // [API_CALL: GET] - Get Portfolio data
    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
    })

    const isLoading = isLoadingPortfolioData || isLoadingPlatformData || isConnectingWallet
    const isAaveV3Protocol = platformData?.platform?.protocol_type === PlatformType.AAVE
    const isMorphoProtocol = platformData?.platform?.protocol_type === PlatformType.MORPHO
    const isFluidProtocol = platformData?.platform?.protocol_type === PlatformType.FLUID

    if (isLoading && (isAaveV3Protocol || isMorphoProtocol)) {
        return <LoadingSectionSkeleton className="h-[300px] w-full" />
    }

    if (isAaveV3Protocol) {
        return <AaveV3TxWidget
            isLoading={isLoading}
            platformData={platformData}
            portfolioData={portfolioData}
        />
    }

    if (isMorphoProtocol) {
        return <MorphoTxWidget
            isLoading={isLoadingPlatformData}
            platformData={platformData}
        />
    }

    if (isFluidProtocol) {
        return <FluidTxWidget
            isLoading={isLoadingPlatformData}
            platformData={platformData}
        />
    }

    return null;
}