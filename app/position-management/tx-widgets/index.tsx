'use client'

import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { FC, useContext } from 'react'
import { PlatformType, TPlatform } from '@/types/platform'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { useSearchParams } from 'next/navigation'
import { TPositionType } from '@/types'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import AaveV3TxWidget from './aave-tx-widget'
import MorphoTxWidget from './morpho-tx-widget'
import FluidTxWidget from './fluid-tx-widget'
import ExposureAdjustmentWidget from './exposure-adjustment-widget'
import { ChainId } from '@/types/chain'
import { useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useTelegramDialog } from '@/hooks/useTelegramDialog'
import { PortfolioContext } from '@/context/portfolio-provider'
import { TelegramConnectionDialog } from '@/components/dialogs/TelegramConnectionDialog'
import { TPortfolio } from '@/types/queries/portfolio'
import { MORPHO_BLUE_API_CHAINIDS } from '../../../lib/constants'

export const AssetTxWidget: FC = () => {
    const { portfolioData: portfolioContextData } = useContext(PortfolioContext)
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const exposure_widget = searchParams.get('exposure_widget') === 'true'
    const {
        walletAddress,
        handleSwitchChain,
        isWalletConnected,
        isConnectingWallet,
    } = useWalletConnection()
    const { lendTx, isLendBorrowTxDialogOpen } = useTxContext() as TTxContext

    const lendTxCompleted: boolean =
        lendTx.isConfirmed && !!lendTx.hash && lendTx.status === 'view'
    const isLendTxCompletedAndDialogClosed: boolean =
        lendTxCompleted && !isLendBorrowTxDialogOpen
    const portfolioValue =
        Number(portfolioContextData?.total_supplied || 0) -
        Number(portfolioContextData?.total_borrowed || 0)

    const { showTelegramDialog, setShowTelegramDialog } = useTelegramDialog({
        portfolioValue,
        lendTxCompleted: isLendTxCompletedAndDialogClosed,
        walletAddress,
    })

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

    const isLoading =
        isLoadingPortfolioData || isLoadingPlatformData || isConnectingWallet
    const isAaveV3Protocol =
        platformData?.platform?.protocol_type === PlatformType.AAVE
    const isMorphoProtocol =
        platformData?.platform?.protocol_type === PlatformType.MORPHO
    const isMorphoMarket = isMorphoProtocol && !platformData?.platform?.isVault
    const isFluidProtocol =
        platformData?.platform?.protocol_type === PlatformType.FLUID

    if (isLoading && (isAaveV3Protocol || isMorphoProtocol)) {
        return <LoadingSectionSkeleton className="h-[300px] w-full" />
    }

    if (isAaveV3Protocol) {
        return (
            <WidgetContainer isLoading={isLoading} platformData={platformData} portfolioData={portfolioData}>
                <AaveV3TxWidget
                    isLoading={isLoading}
                    platformData={platformData}
                    portfolioData={portfolioData}
                />
                <TelegramConnectionDialog
                    open={showTelegramDialog}
                    setOpen={setShowTelegramDialog}
                    portfolioValue={portfolioValue}
                    website="AGGREGATOR"
                />
            </WidgetContainer>
        )
    }

    if (isMorphoProtocol) {
        if (
            isMorphoMarket &&
            !MORPHO_BLUE_API_CHAINIDS.includes(Number(chain_id))
        )
            return null
        return (
            <WidgetContainer isLoading={isLoading} platformData={platformData} portfolioData={portfolioData}>
                <MorphoTxWidget
                    isLoading={isLoadingPlatformData}
                    platformData={platformData}
                />
                <TelegramConnectionDialog
                    open={showTelegramDialog}
                    setOpen={setShowTelegramDialog}
                    portfolioValue={portfolioValue}
                    website="AGGREGATOR"
                />
            </WidgetContainer>
        )
    }

    if (isFluidProtocol) {
        return (
            <WidgetContainer isLoading={isLoading} platformData={platformData} portfolioData={portfolioData}>
                <FluidTxWidget
                    isLoading={isLoadingPlatformData}
                    platformData={platformData}
                    portfolioData={portfolioData}
                />
                <TelegramConnectionDialog
                    open={showTelegramDialog}
                    setOpen={setShowTelegramDialog}
                    portfolioValue={portfolioValue}
                    website="AGGREGATOR"
                />
            </WidgetContainer>
        )
    }

    return null
}

const WidgetContainer: FC<{ children: React.ReactNode, isLoading: boolean, platformData: TPlatform, portfolioData: TPortfolio }> = ({ children, isLoading, platformData, portfolioData }) => {
    return (
        <div className="flex flex-col gap-4">
            {children}
            <ExposureAdjustmentWidget
                isLoading={isLoading}
                platformData={platformData}
                portfolioData={portfolioData}
            />
        </div>
    )
}
