import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
    BaseError,
    useAccount,
    useConnect,
    useWaitForTransactionReceipt,
    useWriteContract,
    useReadContract,
} from 'wagmi'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
import STRATEGY_FACTORY_ABI from '@/data/abi/superlendStrategyFactoryABI.json'
import STRATEGY_ABI from '@/data/abi/superlendStrategyABI.json'
import { parseUnits } from 'ethers/lib/utils'
import { CHAIN_ID_MAPPER } from '@/constants'
import { Button } from '@/components/ui/button'
import { TLoopTx, TTxContext, useTxContext } from '@/context/tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon, LoaderCircle } from 'lucide-react'
import { getErrorText } from '@/lib/getErrorText'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { TScAmount } from '@/types'
import { useAuth } from '@/context/auth-provider'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'

interface ILoopButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: TScAmount
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
    ctaText?: string | null
    isLoading?: boolean
}

const LoopButton = ({
    assetDetails,
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
    ctaText,
    isLoading,
}: ILoopButtonProps) => {
    const { logEvent } = useAnalytics()
    const { isWalletConnected, walletAddress } = useWalletConnection()
    const { writeContract, writeContractAsync, isPending, data: hash, error, status, reset } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        confirmations: 2,
        hash,
    })
    const { loopTx, setLoopTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    const LOOPING_LEVERAGE_ADDRESS = '0x1c055a9609529F30b0917231F43aEAaD7C0264F6'
    const STRATEGY_FACTORY_ADDRESS = '0x5739b234bCf3E7D1de2eC4EC3D0401917C6c366F'

    const [strategyAddress, setStrategyAddress] = useState<string>(assetDetails?.strategyAddress || '')
    const [hasExistingStrategy, setHasExistingStrategy] = useState<boolean>(!!assetDetails?.strategyAddress)
    const [isProcessingFlow, setIsProcessingFlow] = useState<boolean>(false)
    const [isApproved, setIsApproved] = useState<boolean>(false)
    const isDisabledCta = loopTx.isPending || loopTx.isConfirming || disabled || !isWalletConnected

    const assetDetailsRef = useRef(assetDetails)
    const amountRef = useRef(amount)

    useEffect(() => {
        assetDetailsRef.current = assetDetails
    }, [assetDetails])

    useEffect(() => {
        amountRef.current = amount
    }, [amount])

    // Update strategy address when assetDetails changes
    useEffect(() => {
        if (assetDetails?.strategyAddress) {
            setStrategyAddress(assetDetails.strategyAddress)
            setHasExistingStrategy(true)
        }
    }, [assetDetails?.strategyAddress])

    const eModeValue = useMemo(() => {
        if (assetDetails?.lendReserve?.emode_category !== undefined && assetDetails?.borrowReserve?.emode_category !== undefined) {
            const lendEmode = assetDetails.lendReserve.emode_category
            const borrowEmode = assetDetails.borrowReserve.emode_category
            const isCorrelated = assetDetails.strategy?.correlated

            if (isCorrelated && lendEmode === borrowEmode && lendEmode > 0) {
                return lendEmode
            }
            return 0
        }

        if (assetDetails?.supplyAsset?.emode_category !== undefined && assetDetails?.borrowAsset?.emode_category !== undefined) {
            const supplyEmode = assetDetails.supplyAsset.emode_category
            const borrowEmode = assetDetails.borrowAsset.emode_category

            if (supplyEmode === borrowEmode && supplyEmode > 0) {
                return supplyEmode
            }
        }

        return 0
    }, [assetDetails])

    const txBtnStatus: Record<string, string> = {
        pending: loopTx.status === 'approve' ? 'Approving token...' : 
                loopTx.status === 'check_strategy' ? 'Checking strategy...' : 
                loopTx.status === 'create_strategy' ? 'Creating strategy...' : 'Opening position...',
        confirming: 'Confirming...',
        success: 'Close',
        default: 'Start Looping',
    }

    const getTxButtonText = (isPending: boolean, isConfirming: boolean, isConfirmed: boolean) => {
        // Check if this is a leverage-only change
        const isLeverageOnlyChange = Number(amountRef.current?.lendAmount || 0) === 0 && hasExistingStrategy
        
        if (isLeverageOnlyChange && loopTx.status === 'check_strategy') {
            return 'Adjusting leverage...'
        }
        
        if (isLeverageOnlyChange && loopTx.status === 'open_position') {
            return 'Adjusting leverage...'
        }
        
        const status = loopTx.isConfirming ? 'confirming' : 
                     loopTx.isConfirmed && loopTx.status === 'view' ? 'success' : 
                     loopTx.isPending ? 'pending' : 'default'
        
        if (status === 'default' && isLeverageOnlyChange) {
            return 'Adjust Leverage'
        }
        
        // For existing strategies, show "Open Position" instead of "Start Looping"
        if (status === 'default' && hasExistingStrategy) {
            return 'Open Position'
        }
        
        return txBtnStatus[status]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    useEffect(() => {
        setLoopTx((prev: TLoopTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed, setLoopTx])

    const checkWalletConnection = () => {
        if (!isWalletConnected || !walletAddress) {
            setLoopTx((prev: TLoopTx) => ({
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
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: status,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: '',
            }))
        } else {
            setLoopTx((prev: TLoopTx) => ({
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
    }, [setLoopTx])

    const { data: existingStrategyAddress, refetch: refetchStrategy } = useReadContract({
        address: STRATEGY_FACTORY_ADDRESS as `0x${string}`,
        abi: STRATEGY_FACTORY_ABI,
        functionName: 'getUserStrategy',
        args: walletAddress ? [
            walletAddress,
            poolContractAddress,
            assetDetailsRef.current?.supplyAsset?.token?.address,
            assetDetailsRef.current?.borrowAsset?.token?.address,
            eModeValue
        ] : undefined,
        query: {
            enabled: !!walletAddress && !!assetDetailsRef.current?.supplyAsset?.token?.address
        }
    })

    const onOpenPosition = useCallback(async () => {
        if (!checkWalletConnection()) return

        try {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'open_position',
                hash: '',
                errorMessage: '',
            }))

            const supplyAmount = parseUnits(
                amountRef.current?.lendAmount?.toString() ?? '0',
                assetDetailsRef.current?.supplyAsset?.token?.decimals ?? 18
            )
            const flashLoanAmount = parseUnits(
                amountRef.current?.flashLoanAmount?.toString() ?? '0',
                assetDetailsRef.current?.supplyAsset?.token?.decimals ?? 18
            )
            const delegationAmount = parseUnits(
                amountRef.current?.borrowAmount?.toString() ?? '0',
                assetDetailsRef.current?.borrowAsset?.token?.decimals ?? 18
            )

            console.log('=== Opening Loop Position ===')
            console.log('Strategy address being used:', strategyAddress)
            console.log('Is leverage-only change:', Number(amountRef.current?.lendAmount || 0) === 0)
            console.log('Contract call parameters:', {
                supplyAmount: supplyAmount.toString(),
                flashLoanAmount: flashLoanAmount.toString(),
                delegationAmount: delegationAmount.toString(),
                delegationWith20Percent: delegationAmount.mul(120).div(100).toString(),
                pathTokens: assetDetailsRef.current.pathTokens || [],
                pathFees: assetDetailsRef.current.pathFees || []
            })

            await writeContractAsync({
                address: strategyAddress as `0x${string}`,
                abi: STRATEGY_ABI,
                functionName: 'openPosition',
                args: [
                    supplyAmount.toBigInt(),
                    flashLoanAmount.toBigInt(),
                    assetDetailsRef.current.pathTokens || [],
                    assetDetailsRef.current.pathFees || [],
                    delegationAmount.mul(120).div(100).toBigInt()
                ],
            })
        } catch (error: any) {
            console.error('onOpenPosition error', error)
            handleTransactionError(error, 'open_position')
        }
    }, [strategyAddress, walletAddress, setLoopTx, writeContractAsync, handleTransactionError])

    const onApproveSupply = useCallback(async (strategyAddr: string) => {
        if (!checkWalletConnection()) return

        try {
            if (!strategyAddr) {
                throw new Error('No strategy address available for approval')
            }

            const decimals = assetDetailsRef.current?.supplyAsset?.token?.decimals ?? 18
            const lendAmountToApprove = amountRef.current?.lendAmount?.toString() ?? '0'
            
            // For leverage-only changes, skip approval and go directly to open position
            if (Number(lendAmountToApprove) === 0 || lendAmountToApprove === '') {
                console.log('=== Leverage-Only Change - Skipping Approval ===')
                console.log('Lend amount is 0, skipping approval and going directly to open position')
                
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: 'approval_skipped',
                    approveHash: 'approval_skipped',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                }))
                
                setTimeout(async () => {
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        status: 'open_position',
                        hash: '',
                    }))
                    await onOpenPosition()
                }, 1000)
                
                return
            }

            const roundedAmount = Number(lendAmountToApprove).toFixed(decimals)
            const parsedLendAmountBn = parseUnits(roundedAmount, decimals)
            const approveAmount = parsedLendAmountBn.toBigInt()

            logEvent('approve_loop_initiated', {
                amount: amountRef.current?.lendAmount ?? '0',
                token_symbol: assetDetailsRef.current?.supplyAsset?.token?.symbol ?? '',
                platform_name: assetDetailsRef.current?.name ?? '',
                chain_name: CHAIN_ID_MAPPER[Number(assetDetailsRef.current?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            try {
                await writeContractAsync({
                    address: underlyingAssetAdress,
                    abi: AAVE_APPROVE_ABI,
                    functionName: 'approve',
                    args: [strategyAddr, approveAmount],
                })
            } catch (directError: any) {
                await writeContractAsync({
                    address: underlyingAssetAdress,
                    abi: AAVE_APPROVE_ABI,
                    functionName: 'approve',
                    args: [strategyAddr, BigInt(0)],
                })

                await writeContractAsync({
                    address: underlyingAssetAdress,
                    abi: AAVE_APPROVE_ABI,
                    functionName: 'approve',
                    args: [strategyAddr, approveAmount],
                })
            }
        } catch (error: any) {
            console.error('onApproveSupply error', error)
            handleTransactionError(error, 'approve')
        }
    }, [walletAddress, underlyingAssetAdress, logEvent, setLoopTx, writeContractAsync, onOpenPosition, handleTransactionError])
    
    const onCreateStrategy = useCallback(async () => {
        if (!checkWalletConnection()) return

        const createStrategyParams = {
            loopingLeverage: LOOPING_LEVERAGE_ADDRESS,
            pool: poolContractAddress,
            yieldAsset: assetDetailsRef.current.supplyAsset.token.address,
            debtAsset: assetDetailsRef.current.borrowAsset.token.address,
            eMode: eModeValue
        }

        console.log('Creating strategy with params:', createStrategyParams)

        try {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'create_strategy',
                hash: '',
                errorMessage: '',
            }))

            await writeContractAsync({
                address: STRATEGY_FACTORY_ADDRESS as `0x${string}`,
                abi: STRATEGY_FACTORY_ABI,
                functionName: 'createStrategy',
                args: [
                    createStrategyParams.loopingLeverage,
                    createStrategyParams.pool,
                    createStrategyParams.yieldAsset,
                    createStrategyParams.debtAsset,
                    createStrategyParams.eMode
                ],
            })
        } catch (error: any) {
            console.error('onCreateStrategy error', error)
            handleTransactionError(error, 'create_strategy')
        }
    }, [walletAddress, poolContractAddress, eModeValue, setLoopTx, writeContractAsync, onApproveSupply, handleTransactionError])
    
    const onCheckStrategy = useCallback(async () => {
        if (!checkWalletConnection()) return

        console.log('=== Starting Strategy Check ===')
        console.log('Asset details strategy address:', assetDetailsRef.current?.strategyAddress)
        console.log('Current strategy address state:', strategyAddress)

        // If we already have a strategy address from assetDetails, skip the check
        if (assetDetailsRef.current?.strategyAddress) {
            console.log('=== Using Existing Strategy from AssetDetails ===')
            console.log('Strategy address from assetDetails:', assetDetailsRef.current.strategyAddress)
            
            setStrategyAddress(assetDetailsRef.current.strategyAddress)
            setHasExistingStrategy(true)
            
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'check_strategy',
                hash: 'strategy_found',
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
            }))
            
            // For leverage-only changes, skip approval and go directly to open position
            const isLeverageOnlyChange = Number(amountRef.current?.lendAmount || 0) === 0
            console.log('Is leverage-only change:', isLeverageOnlyChange)
            console.log('Lend amount:', amountRef.current?.lendAmount)
            
            if (isLeverageOnlyChange) {
                console.log('=== Leverage-Only Change Detected ===')
                console.log('Skipping approval and going directly to open position')
                
                setTimeout(async () => {
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        status: 'open_position',
                    }))
                    await onOpenPosition()
                }, 1500)
            } else {
                console.log('=== Non-Leverage Change - Going Through Approval ===')
                setTimeout(async () => {
                    await onApproveSupply(assetDetailsRef.current.strategyAddress)
                }, 1500)
            }
            return
        }

        console.log('=== No Strategy in AssetDetails - Checking Factory ===')

        try {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'check_strategy',
                hash: '',
                errorMessage: '',
                isPending: true,
                isConfirming: false,
                isConfirmed: false,
            }))

            await new Promise(resolve => setTimeout(resolve, 800))

            const { data: existingStrategy } = await refetchStrategy()
            console.log('Strategy found from factory:', existingStrategy)
            
            if (existingStrategy && existingStrategy !== '0x0000000000000000000000000000000000000000') {
                console.log('=== Existing Strategy Found in Factory ===')
                console.log('Strategy address from factory:', existingStrategy)
                
                setStrategyAddress(existingStrategy as string)
                setHasExistingStrategy(true)
                
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'check_strategy',
                    hash: 'strategy_found',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                }))
                
                // Let the transaction completion handler proceed with the flow
                console.log('=== Strategy Found - Letting Transaction Handler Proceed ===')
            } else {
                console.log('=== No Existing Strategy Found - Creating New Strategy ===')
                setHasExistingStrategy(false)
                
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'check_strategy',
                    hash: 'check_complete',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                }))
                
                setTimeout(async () => {
                    await onCreateStrategy()
                }, 1500)
            }
            
        } catch (error: any) {
            console.error('onCheckStrategy error', error)
            handleTransactionError(error, 'check_strategy')
        }
    }, [walletAddress, refetchStrategy, eModeValue, setLoopTx, onApproveSupply, onCreateStrategy, handleTransactionError, onOpenPosition])

    useEffect(() => {
        // For strategy check completion, we don't have a hash but we still need to handle it
        if (loopTx.status === 'check_strategy' && loopTx.hash === 'strategy_found' && !isPending && !isConfirming) {
            const handleTransactionCompletion = async () => {
                // Strategy was found from factory, proceed with the flow
                console.log('=== Strategy Found from Factory - Proceeding with Flow ===')
                const isLeverageOnlyChange = Number(amountRef.current?.lendAmount || 0) === 0
                
                if (isLeverageOnlyChange) {
                    console.log('=== Leverage-Only Change with Found Strategy ===')
                    setTimeout(async () => {
                        setLoopTx((prev: TLoopTx) => ({
                            ...prev,
                            status: 'open_position',
                        }))
                        await onOpenPosition()
                    }, 1500)
                } else {
                    console.log('=== Non-Leverage Change with Found Strategy ===')
                    setTimeout(async () => {
                        await onApproveSupply(strategyAddress)
                    }, 1500)
                }
            }
            handleTransactionCompletion()
            return
        }

        if (!hash || !isConfirmed || isPending || isConfirming) return

        const handleTransactionCompletion = async () => {
            if (loopTx.status === 'approve' && !isApproved) {
                // Handle approval completion
                if (loopTx.hash === 'approval_skipped') {
                    // Approval was skipped for leverage-only change
                    console.log('=== Approval Skipped - Proceeding to Open Position ===')
                    setIsApproved(true)
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        status: 'open_position',
                        hash: '',
                    }))
                    
                    setTimeout(async () => {
                        await onOpenPosition()
                    }, 1500)
                } else {
                    // Normal approval completion
                    setIsApproved(true)
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        approveHash: hash,
                        hash: '',
                    }))
                    
                    setTimeout(async () => {
                        setLoopTx((prev: TLoopTx) => ({
                            ...prev,
                            status: 'open_position',
                        }))
                        await onOpenPosition()
                    }, 1500)
                }

            } else if (loopTx.status === 'create_strategy') {
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    hash: '',
                }))
                
                setTimeout(async () => {
                    const { data: newStrategyAddress } = await refetchStrategy()
                    if (newStrategyAddress && newStrategyAddress !== '0x0000000000000000000000000000000000000000') {
                        setStrategyAddress(newStrategyAddress as string)
                        await onApproveSupply(newStrategyAddress as string)
                    }
                }, 1500)

            } else if (loopTx.status === 'open_position') {
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    hash: hash,
                    status: 'view',
                }))

                logEvent('loop_completed', {
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
    }, [hash, isConfirmed, isPending, isConfirming, loopTx.status, onOpenPosition, onApproveSupply, refetchStrategy, setLoopTx, logEvent, walletAddress, isApproved])

    useEffect(() => {
        const isActualTransaction = loopTx.status === 'approve' || loopTx.status === 'create_strategy' || loopTx.status === 'open_position'
        
        if (
            isActualTransaction &&
            !isPending &&
            !isConfirming &&
            !isConfirmed &&
            !hash &&
            loopTx.status !== 'view' &&
            (loopTx.isPending || loopTx.isConfirming) &&
            !loopTx.hash
        ) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: 'Transaction was cancelled because the action was not confirmed in your wallet',
            }))
            setIsProcessingFlow(false)
        }
    }, [isPending, isConfirming, isConfirmed, hash, loopTx.isPending, loopTx.isConfirming, loopTx.status, loopTx.hash, setLoopTx])

    const handleSCInteraction = useCallback(async () => {
        console.log('=== Loop Button Clicked ===')
        console.log('Starting automated flow with eMode:', eModeValue)
        console.log('Asset details strategy address:', assetDetailsRef.current?.strategyAddress)
        console.log('Current strategy address state:', strategyAddress)
        console.log('Has existing strategy:', hasExistingStrategy)

        if (!checkWalletConnection()) return

        if (loopTx.status === 'view') {
            handleCloseModal(false)
            return
        }

        if (loopTx.errorMessage) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                errorMessage: '',
            }))
        }

        setIsProcessingFlow(true)
        console.log('assetDetailsRef:', assetDetailsRef)
        // If we have an existing strategy address, skip the strategy check entirely
        if (assetDetailsRef.current?.strategyAddress) {
            console.log('=== Existing Strategy Found - Skipping Strategy Check ===')
            console.log('Strategy address:', assetDetailsRef.current.strategyAddress)
            
            setStrategyAddress(assetDetailsRef.current.strategyAddress)
            setHasExistingStrategy(true)
            
            // Check if this is a leverage-only change
            const isLeverageOnlyChange = Number(amountRef.current?.lendAmount || 0) === 0
            console.log('Is leverage-only change:', isLeverageOnlyChange)
            console.log('Lend amount:', amountRef.current?.lendAmount)
            
            if (isLeverageOnlyChange) {
                console.log('=== Leverage-Only Change - Going Directly to Open Position ===')
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'open_position',
                    hash: '',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    errorMessage: '',
                }))
                
                setTimeout(async () => {
                    await onOpenPosition()
                }, 1000)
            } else {
                console.log('=== Non-Leverage Change - Going Through Approval ===')
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    errorMessage: '',
                }))
                
                setTimeout(async () => {
                    await onApproveSupply(assetDetailsRef.current.strategyAddress)
                }, 1000)
            }
            return
        }

        // Only do strategy check if we don't have an existing strategy
        console.log('=== No Existing Strategy - Starting Strategy Check ===')
        try {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'check_strategy',
                hash: '',
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: '',
            }))
            setIsApproved(false)

            await onCheckStrategy()
        } catch (error: any) {
            console.error('Error starting loop flow:', error)
            handleTransactionError(error, 'check_strategy')
        }
    }, [loopTx.status, loopTx.errorMessage, isWalletConnected, walletAddress, eModeValue, onCheckStrategy, handleTransactionError, handleCloseModal, setLoopTx, strategyAddress, hasExistingStrategy, onOpenPosition, onApproveSupply])

    return (
        <div className="flex flex-col gap-2">
            {error && <CustomAlert description={getErrorText(error)} />}
            {((loopTx.errorMessage.length > 0) && !error) && (
                <CustomAlert description={loopTx.errorMessage} />
            )}
            <Button
                disabled={isDisabledCta || isProcessingFlow}
                onClick={handleSCInteraction}
                className="group flex items-center gap-1 py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {isLoading && <LoaderCircle className="text-white w-4 h-4 animate-spin inline" />}
                {!isWalletConnected ? 'Connect Wallet' : ctaText || txBtnText}
                {(loopTx.status !== 'view' && !isLoading) &&
                    !loopTx.isPending &&
                    !loopTx.isConfirming &&
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

export default LoopButton
