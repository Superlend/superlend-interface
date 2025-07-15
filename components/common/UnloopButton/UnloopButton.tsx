import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
    BaseError,
    useAccount,
    useConnect,
    useWaitForTransactionReceipt,
    useWriteContract,
    useReadContract,
} from 'wagmi'
import STRATEGY_ABI from '@/data/abi/superlendStrategyABI.json'
import STRATEGY_FACTORY_ABI from '@/data/abi/superlendStrategyFactoryABI.json'
import { parseUnits } from 'ethers/lib/utils'
import { CHAIN_ID_MAPPER, TX_EXPLORER_LINKS } from '@/constants'
import { Button } from '@/components/ui/button'
import { TUnloopTx, TTxContext, useTxContext } from '@/context/tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon, LoaderCircle, ExternalLinkIcon } from 'lucide-react'
import { getErrorText } from '@/lib/getErrorText'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { TScAmount } from '@/types'
import { useAuth } from '@/context/auth-provider'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import { BigNumber } from 'ethers'
import { BodyText } from '@/components/ui/typography'

// Helper functions
const getExplorerLink = (hash: string, chainId: ChainId) => {
    return `${TX_EXPLORER_LINKS[chainId]}/tx/${hash}`
}

const getTruncatedTxHash = (hash: string) => {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

interface IUnloopButtonProps {
    assetDetails: any
    disabled: boolean
    strategyAddress: string
    amount: TScAmount
    handleCloseModal: (isVisible: boolean) => void
    ctaText?: string | null
    isLoading?: boolean
}

const UnloopButton = ({
    assetDetails,
    strategyAddress,
    amount,
    disabled,
    handleCloseModal,
    ctaText,
    isLoading,
}: IUnloopButtonProps) => {
    const { logEvent } = useAnalytics()
    const { isWalletConnected, walletAddress } = useWalletConnection()
    const { writeContract, writeContractAsync, isPending, data: hash, error, status, reset } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        confirmations: 2,
        hash,
    })
    const { unloopTx, setUnloopTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    const STRATEGY_FACTORY_ADDRESS = '0x5739b234bCf3E7D1de2eC4EC3D0401917C6c366F'

    const [effectiveStrategyAddress, setEffectiveStrategyAddress] = useState<string>(strategyAddress)
    const [isProcessingFlow, setIsProcessingFlow] = useState<boolean>(false)
    
    // Check if we have valid path tokens and fees
    const hasValidPathTokens = assetDetails?.pathTokens && Array.isArray(assetDetails.pathTokens) && assetDetails.pathTokens.length > 0
    const hasValidPathFees = assetDetails?.pathFees && Array.isArray(assetDetails.pathFees) && assetDetails.pathFees.length > 0
    const hasValidTradePath = hasValidPathTokens && hasValidPathFees
    
    const isDisabledCta = unloopTx.isPending || unloopTx.isConfirming || disabled || !isWalletConnected 

    const assetDetailsRef = useRef(assetDetails)
    const amountRef = useRef(amount)

    useEffect(() => {
        assetDetailsRef.current = assetDetails
    }, [assetDetails])

    useEffect(() => {
        amountRef.current = amount
    }, [amount])

    // Update effective strategy address when strategyAddress prop changes
    useEffect(() => {
        setEffectiveStrategyAddress(strategyAddress)
    }, [strategyAddress])

    const txBtnStatus: Record<string, string> = {
        pending: unloopTx.status === 'close_position' ? 'Closing position...' : 
                unloopTx.status === 'check_strategy' ? 'Checking strategy...' : 'Unlooping in progress...',
        confirming: 'Confirming transaction...',
        success: 'Close',
        default: 'Start Unlooping',
    }

    const getTxButtonText = (isPending: boolean, isConfirming: boolean, isConfirmed: boolean) => {
        // If trade path is not ready, show loading message
        if (!hasValidTradePath && !unloopTx.isPending && !unloopTx.isConfirming && !unloopTx.isConfirmed) {
            return 'Fetching trade path...'
        }
        
        // Show 'Close' if transaction is confirmed and successful
        if (unloopTx.isConfirmed && unloopTx.status === 'view' && unloopTx.hash && !unloopTx.errorMessage) {
            return 'Close'
        }
        
        return txBtnStatus[
            unloopTx.isConfirming ? 'confirming' : 
            unloopTx.isPending ? 'pending' : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    useEffect(() => {
        setUnloopTx((prev: TUnloopTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed, setUnloopTx])

    const checkWalletConnection = () => {
        if (!isWalletConnected || !walletAddress) {
            setUnloopTx((prev: TUnloopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: 'Please connect your wallet to continue',
            }))
            setIsProcessingFlow(false)
            return false
        }
        return true
    }

    const handleTransactionError = useCallback((error: any, status: string) => {
        const isUserRejection = error?.message?.includes('User rejected') ||
            error?.message?.includes('user rejected') ||
            error?.code === 4001 ||
            error?.code === 'ACTION_REJECTED'

        if (isUserRejection) {
            setUnloopTx((prev: TUnloopTx) => ({
                ...prev,
                status: status,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: '',
            }))
        } else {
            setUnloopTx((prev: TUnloopTx) => ({
                ...prev,
                status: status,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: error?.message?.includes('ConnectorNotConnectedError')
                    ? 'Wallet connection lost. Please reconnect your wallet and try again.'
                    : `Transaction failed. Please try again.`,
            }))
        }
        setIsProcessingFlow(false)
    }, [setUnloopTx])

    // Factory read
    const { data: existingStrategyAddress, refetch: refetchStrategy } = useReadContract({
        address: STRATEGY_FACTORY_ADDRESS as `0x${string}`,
        abi: STRATEGY_FACTORY_ABI,
        functionName: 'getUserStrategy',
        args: walletAddress ? [
            walletAddress,
            assetDetailsRef.current?.core_contract,
            assetDetailsRef.current?.supplyAsset?.token?.address,
            assetDetailsRef.current?.borrowAsset?.token?.address,
            assetDetailsRef.current?.eMode || 0
        ] : undefined,
        query: {
            enabled: !!walletAddress && !!assetDetailsRef.current?.supplyAsset?.token?.address && !effectiveStrategyAddress
        }
    })

    // onClosePosition now takes the strategy address as arg
    const onClosePosition = useCallback(async (strategyToUse: string) => {
        if (!checkWalletConnection()) return
        try {
            setUnloopTx((prev: TUnloopTx) => ({ ...prev, status: 'close_position', hash: '', errorMessage: '' }))
            
            // Use calculated parameters if available, otherwise fall back to original logic
            let repayAmount, aTokenAmount, withdrawAmount
            
            if (assetDetailsRef.current?.unloopParameters) {
                repayAmount = BigNumber.from(assetDetailsRef.current.unloopParameters.repayAmountToken)
                aTokenAmount = BigNumber.from(assetDetailsRef.current.unloopParameters.aTokenAmount)
                withdrawAmount = BigNumber.from(assetDetailsRef.current.unloopParameters.withdrawAmount)
            } else {
                repayAmount = parseUnits(amountRef.current?.borrowAmount?.toString() ?? '0', assetDetailsRef.current?.borrowAsset?.token?.decimals ?? 18)
                aTokenAmount = parseUnits(amountRef.current?.lendAmount?.toString() ?? '0', assetDetailsRef.current?.supplyAsset?.token?.decimals ?? 18)
                withdrawAmount = parseUnits(amountRef.current?.withdrawAmount?.toString() ?? '0', assetDetailsRef.current?.supplyAsset?.token?.decimals ?? 18)
            }

            // Log contract call parameters for closePosition
            console.log('=== Unloop Contract Call Parameters ===', {
                strategyAddress: strategyToUse,
                repayAmount: repayAmount.toString(),
                swapPathTokens: assetDetailsRef.current.pathTokens || [],
                swapPathFees: assetDetailsRef.current.pathFees || [],
                aTokenAmount: aTokenAmount.toString(),
                withdrawAmount: withdrawAmount.toString(),
            })

            await writeContractAsync({
                address: strategyToUse as `0x${string}`,
                abi: STRATEGY_ABI,
                functionName: 'closePosition',
                args: [
                    repayAmount.toBigInt(),
                    assetDetailsRef.current.pathTokens || [],
                    assetDetailsRef.current.pathFees || [],
                    aTokenAmount.toBigInt(),
                    withdrawAmount.toBigInt()
                ],
            })
        } catch (error: any) {
            handleTransactionError(error, 'close_position')
        }
    }, [checkWalletConnection, writeContractAsync, handleTransactionError])

    // Main click handler
    const handleSCInteraction = useCallback(async () => {
        if (!checkWalletConnection()) return
        if (unloopTx.status === 'view') { handleCloseModal(false); return }
        if (unloopTx.errorMessage) setUnloopTx((prev: TUnloopTx) => ({ ...prev, errorMessage: '' }))
        setIsProcessingFlow(true)

        // 1. Try assetDetails.strategyAddress
        let strategyToUse = assetDetailsRef.current?.strategyAddress || ''
        if (strategyToUse && strategyToUse !== '0x0000000000000000000000000000000000000000') {
            setEffectiveStrategyAddress(strategyToUse)
        } else {
            // 2. Try factory
            setUnloopTx((prev: TUnloopTx) => ({ ...prev, status: 'check_strategy', hash: '', isPending: true, isConfirming: false, isConfirmed: false, errorMessage: '' }))
            try {
                const { data: factoryStrategy } = await refetchStrategy()
                if (factoryStrategy && factoryStrategy !== '0x0000000000000000000000000000000000000000') {
                    setEffectiveStrategyAddress(factoryStrategy as string)
                    strategyToUse = factoryStrategy as string
                } else {
                    // 3. Not found: show error, abort
                    setUnloopTx((prev: TUnloopTx) => ({ ...prev, status: 'check_strategy', hash: '', isPending: false, isConfirming: false, isConfirmed: false, errorMessage: 'No strategy contract found for this position. Please contact support.' }))
                    setIsProcessingFlow(false)
                    return
                }
            } catch (err) {
                setUnloopTx((prev: TUnloopTx) => ({ ...prev, status: 'check_strategy', hash: '', isPending: false, isConfirming: false, isConfirmed: false, errorMessage: 'Error fetching strategy from factory.' }))
                setIsProcessingFlow(false)
                return
            }
        }
        // 4. If we have a strategy, proceed with closePosition
        setUnloopTx((prev: TUnloopTx) => ({ ...prev, status: 'close_position', hash: '', isPending: false, isConfirming: false, isConfirmed: false, errorMessage: '' }))
        try {
            await onClosePosition(strategyToUse)
        } catch (err) {
            setUnloopTx((prev: TUnloopTx) => ({ ...prev, status: 'close_position', hash: '', isPending: false, isConfirming: false, isConfirmed: false, errorMessage: 'Failed to send unloop transaction.' }))
            setIsProcessingFlow(false)
        }
    }, [unloopTx.status, unloopTx.errorMessage, isWalletConnected, walletAddress, refetchStrategy, onClosePosition, handleCloseModal, setUnloopTx])

    useEffect(() => {
        // For strategy check completion, we don't have a hash but we still need to handle it
        if (unloopTx.status === 'check_strategy' && unloopTx.hash === 'strategy_found' && !isPending && !isConfirming) {
            const handleTransactionCompletion = async () => {
                setTimeout(async () => {
                    await onClosePosition(effectiveStrategyAddress)
                }, 1500)
            }
            handleTransactionCompletion()
            return
        }

        if (!hash || !isConfirmed || isPending || isConfirming) return

        const handleTransactionCompletion = async () => {
            if (unloopTx.status === 'close_position') {
                setUnloopTx((prev: TUnloopTx) => ({
                    ...prev,
                    hash: hash,
                    status: 'view',
                }))

                logEvent('unloop_completed', {
                    amount: amountRef.current.amountRaw,
                    token_symbol: assetDetailsRef.current?.supplyAsset?.token?.symbol,
                    platform_name: assetDetailsRef.current?.name,
                    chain_name: CHAIN_ID_MAPPER[Number(assetDetailsRef.current?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })
                
                setIsProcessingFlow(false)
            }
        }

        handleTransactionCompletion()
    }, [hash, isConfirmed, isPending, isConfirming, unloopTx.status, setUnloopTx, logEvent, walletAddress, onClosePosition, effectiveStrategyAddress])

    useEffect(() => {
        const isActualTransaction = unloopTx.status === 'close_position' || unloopTx.status === 'check_strategy'
        
        if (
            isActualTransaction &&
            !isPending &&
            !isConfirming &&
            !isConfirmed &&
            !hash &&
            unloopTx.status !== 'view' &&
            (unloopTx.isPending || unloopTx.isConfirming) &&
            !unloopTx.hash
        ) {
            setUnloopTx((prev: TUnloopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: 'Transaction was cancelled because the action was not confirmed in your wallet',
            }))
            setIsProcessingFlow(false)
        }
    }, [isPending, isConfirming, isConfirmed, hash, unloopTx.isPending, unloopTx.isConfirming, unloopTx.status, unloopTx.hash, setUnloopTx])

    return (
        <div className="flex flex-col gap-2">
            {error && <CustomAlert description={getErrorText(error)} />}
            {((unloopTx.errorMessage.length > 0) && !error) && (
                <CustomAlert description={unloopTx.errorMessage} />
            )}
            {unloopTx.isConfirmed && unloopTx.hash && (
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-5">
                    <div className="flex items-center gap-2">
                        <BodyText level="body2" weight="medium" className="text-gray-800">
                            Transaction Hash:
                        </BodyText>
                        <a
                            href={getExplorerLink(unloopTx.hash, Number(assetDetails?.chain_id) as ChainId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:text-primary-hover"
                        >
                            <BodyText level="body2" weight="medium">
                                {getTruncatedTxHash(unloopTx.hash)}
                            </BodyText>
                            <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            )}
            <Button
                disabled={isDisabledCta || isProcessingFlow}
                onClick={handleSCInteraction}
                className="group flex items-center gap-1 py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {(unloopTx.isPending || unloopTx.isConfirming) && (
                    <LoaderCircle className="text-white w-4 h-4 animate-spin mr-2" />
                )}
                {!isWalletConnected ? 'Connect Wallet' : ctaText || txBtnText}
                {(unloopTx.status !== 'view' && !isLoading) &&
                    !unloopTx.isPending &&
                    !unloopTx.isConfirming &&
                    isWalletConnected && (
                        <ArrowRightIcon
                            width={16}
                            height={16}
                            className="stroke-white group-[:disabled]:opacity-50"
                        />
                    )}
            </Button>
        </div>
    )
}

export default UnloopButton 