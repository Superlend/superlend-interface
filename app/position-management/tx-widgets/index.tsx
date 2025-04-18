'use client'

import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { FC, useContext } from 'react'
import { PlatformType } from '@/types/platform'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { useSearchParams } from 'next/navigation'
import { TPositionType } from '@/types'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import AaveV3TxWidget from './aave-tx-widget'
import MorphoTxWidget from './morpho-tx-widget'
import FluidTxWidget from './fluid-tx-widget'
import { ChainId } from '@/types/chain'
import { useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useDiscordDialog } from '@/hooks/useDiscordDialog'
import { PortfolioContext } from '@/context/portfolio-provider'
import { DiscordConnectionDialog } from '@/components/dialogs/DiscordConnectionDialog'

export const AssetTxWidget: FC = () => {
    const { portfolioData: portfolioContextData } = useContext(PortfolioContext)
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const {
        walletAddress,
        handleSwitchChain,
        isWalletConnected,
        isConnectingWallet,
    } = useWalletConnection()
    const {
        lendTx,
        isLendBorrowTxDialogOpen,
    } = useTxContext() as TTxContext

    const lendTxCompleted: boolean = (lendTx.isConfirmed && !!lendTx.hash && lendTx.status === 'view')
    const isLendTxCompletedAndDialogClosed: boolean = (lendTxCompleted && !isLendBorrowTxDialogOpen)
    const portfolioValue = Number(portfolioContextData?.total_supplied || 0) - Number(portfolioContextData?.total_borrowed || 0)

    const {
        showDiscordDialog,
        setShowDiscordDialog
    } = useDiscordDialog({
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
    const isFluidProtocol =
        platformData?.platform?.protocol_type === PlatformType.FLUID
    const isPolygonChain = Number(chain_id) === ChainId.Polygon

    if (isLoading && (isAaveV3Protocol || isMorphoProtocol)) {
        return <LoadingSectionSkeleton className="h-[300px] w-full" />
    }

    if (isAaveV3Protocol) {
        return (
            <>
                <AaveV3TxWidget
                    isLoading={isLoading}
                    platformData={platformData}
                    portfolioData={portfolioData}
                />
                <DiscordConnectionDialog
                    open={showDiscordDialog}
                    setOpen={setShowDiscordDialog}
                    portfolioValue={portfolioValue}
                />
            </>
        )
    }

    if (isMorphoProtocol && !isPolygonChain) {
        return (
            <>
                <MorphoTxWidget
                    isLoading={isLoadingPlatformData}
                    platformData={platformData}
                />
                <DiscordConnectionDialog
                    open={showDiscordDialog}
                    setOpen={setShowDiscordDialog}
                    portfolioValue={portfolioValue}
                />
            </>
        )
    }

    if (isFluidProtocol) {
        return (
            <>
                <FluidTxWidget
                    isLoading={isLoadingPlatformData}
                    platformData={platformData}
                    portfolioData={portfolioData}
                />
                <DiscordConnectionDialog
                    open={showDiscordDialog}
                    setOpen={setShowDiscordDialog}
                    portfolioValue={portfolioValue}
                />
            </>
        )
    }

    return null
}
