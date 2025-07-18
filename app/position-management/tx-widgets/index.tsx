'use client'

import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import { FC, useContext } from 'react'
import { PlatformType, TPlatform } from '@/types/platform'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { useSearchParams } from 'next/navigation'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import AaveV3TxWidget from './aave-tx-widget'
import MorphoTxWidget from './morpho-tx-widget'
import FluidTxWidget from './fluid-tx-widget'
import LoopingWidget from './looping-widget'
import { ChainId } from '@/types/chain'
import { useTxContext } from '@/context/tx-provider'
import { TTxContext } from '@/context/tx-provider'
import { useWhalesSupportDialog } from '@/hooks/useWhalesSupportDialog'
import { PortfolioContext } from '@/context/portfolio-provider'
import { TPortfolio } from '@/types/queries/portfolio'
import { WhalesSupportDialog } from '@/components/dialogs/WhalesSupportDialog'
import { MORPHO_BLUE_API_CHAINIDS } from '../../../lib/constants'

export const AssetTxWidget: FC = () => {
    const { portfolioData: portfolioContextData } = useContext(PortfolioContext)
    const searchParams = useSearchParams()
    // const tokenAddress = searchParams.get('token') || ''
    const position_type = searchParams.get('position_type') || ''
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const chain_id = searchParams?.get('chain_id') || '1'
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

    const { showWhalesSupportDialog, setShowWhalesSupportDialog } = useWhalesSupportDialog({
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
    const isLoopingPosition = position_type === 'loop'

    if (isLoading && (isAaveV3Protocol || isMorphoProtocol)) {
        return <LoadingSectionSkeleton className="h-[300px] w-full" />
    }

    if (isLoopingPosition && !isLoading) {
        return (
            <LoopingWidget
                isLoading={isLoading}
                platformData={platformData}
                portfolioData={portfolioData}
            />
        )
    }

    if (isAaveV3Protocol && !isLoading) {
        return (
            <WidgetWrapper
                isLoading={isLoading}
                platformData={platformData}
                portfolioData={portfolioData}
                showWhalesSupportDialog={showWhalesSupportDialog}
                setShowWhalesSupportDialog={setShowWhalesSupportDialog}
                portfolioValue={portfolioValue}
            >
                <AaveV3TxWidget
                    isLoading={isLoading}
                    platformData={platformData}
                    portfolioData={portfolioData}
                />
            </WidgetWrapper>
        )
    }

    if (isMorphoProtocol && !isLoading) {
        // if (
        //     isMorphoMarket &&
        //     !MORPHO_BLUE_API_CHAINIDS.includes(Number(chain_id))
        // )
        //     return null
        return (
            <WidgetWrapper
                isLoading={isLoadingPlatformData}
                platformData={platformData}
                portfolioData={portfolioData}
                showWhalesSupportDialog={showWhalesSupportDialog}
                setShowWhalesSupportDialog={setShowWhalesSupportDialog}
                portfolioValue={portfolioValue}
            >
                <MorphoTxWidget
                    isLoading={isLoadingPlatformData}
                    platformData={platformData}
                />
            </WidgetWrapper>
        )
    }

    if (isFluidProtocol && !isLoading) {
        return (
            <WidgetWrapper
                isLoading={isLoadingPlatformData}
                platformData={platformData}
                portfolioData={portfolioData}
                showWhalesSupportDialog={showWhalesSupportDialog}
                setShowWhalesSupportDialog={setShowWhalesSupportDialog}
                portfolioValue={portfolioValue}
            >
                <FluidTxWidget
                    isLoading={isLoadingPlatformData}
                    platformData={platformData}
                    portfolioData={portfolioData}
                />
            </WidgetWrapper>
        )
    }

    return null
}

export const WidgetWrapper = ({
    children,
    isLoading,
    platformData,
    portfolioData,
    showWhalesSupportDialog,
    setShowWhalesSupportDialog,
    portfolioValue
}: {
    children: React.ReactNode,
    isLoading: boolean,
    platformData: TPlatform,
    portfolioData: TPortfolio,
    showWhalesSupportDialog: boolean,
    setShowWhalesSupportDialog: (show: boolean) => void,
    portfolioValue: number
}) => {
    return (
        <div className="flex flex-col gap-4">
            {children}
            <WhalesSupportDialog
                open={showWhalesSupportDialog}
                setOpen={setShowWhalesSupportDialog}
                portfolioValue={portfolioValue}
                website="AGGREGATOR"
            />
        </div>
    )
}
