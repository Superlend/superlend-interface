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
import {
    CHAIN_ID_MAPPER,
} from '@/constants'
import { Button } from '@/components/ui/button'
import {
    TLoopTx,
    TTxContext,
    useTxContext,
} from '@/context/tx-provider'
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

/**
 * New Looping Flow:
 * 1. Check if user has existing strategy using getUserStrategy
 * 2. If no strategy exists, create one using createStrategy
 * 3. Approve tokens to strategy contract
 * 4. Open position through strategy contract (includes credit delegation)
 */
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
    const {
        writeContract,
        writeContractAsync,
        isPending,
        data: hash,
        error,
        status,
        reset,
    } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 2,
            hash,
        })
    const { loopTx, setLoopTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    // Contract addresses
    const LOOPING_LEVERAGE_ADDRESS = '0x1c055a9609529F30b0917231F43aEAaD7C0264F6'
    const STRATEGY_FACTORY_ADDRESS = '0x5739b234bCf3E7D1de2eC4EC3D0401917C6c366F'

    // Track strategy contract address and flow state
    const [strategyAddress, setStrategyAddress] = useState<string>('')
    const [hasExistingStrategy, setHasExistingStrategy] = useState<boolean>(false)
    const [isProcessingFlow, setIsProcessingFlow] = useState<boolean>(false)
    const [isApproved, setIsApproved] = useState<boolean>(false)
    const isDisabledCta = loopTx.isPending || loopTx.isConfirming || disabled || !isWalletConnected

    const assetDetailsRef = useRef(assetDetails);
    useEffect(() => {
        assetDetailsRef.current = assetDetails;
    }, [assetDetails]);

    const amountRef = useRef(amount);
    useEffect(() => {
        amountRef.current = amount;
    }, [amount]);

    // Debug: Log assetDetails when they change
    useEffect(() => {
        console.log('LoopButton received assetDetails:', {
            pathTokens: assetDetails?.pathTokens,
            pathFees: assetDetails?.pathFees,
            hasPathTokens: Array.isArray(assetDetails?.pathTokens),
            hasPathFees: Array.isArray(assetDetails?.pathFees),
            pathTokensLength: assetDetails?.pathTokens?.length,
            pathFeesLength: assetDetails?.pathFees?.length,
            allKeys: Object.keys(assetDetails || {})
        })
    }, [assetDetails?.pathTokens, assetDetails?.pathFees])

    // Calculate eMode value based on loop pair data
    const eModeValue = useMemo(() => {
        // If we have loop pair data with reserves, use that
        if (assetDetails?.lendReserve?.emode_category !== undefined && assetDetails?.borrowReserve?.emode_category !== undefined) {
            const lendEmode = assetDetails.lendReserve.emode_category
            const borrowEmode = assetDetails.borrowReserve.emode_category
            const isCorrelated = assetDetails.strategy?.correlated

            // If the pair is correlated and both tokens have the same emode category, use it
            if (isCorrelated && lendEmode === borrowEmode && lendEmode > 0) {
                return lendEmode
            }
            
            // If not correlated or different emode categories, use 0 (no emode)
            return 0
        }

        // Fallback to checking individual asset emode categories
        if (assetDetails?.supplyAsset?.emode_category !== undefined && assetDetails?.borrowAsset?.emode_category !== undefined) {
            const supplyEmode = assetDetails.supplyAsset.emode_category
            const borrowEmode = assetDetails.borrowAsset.emode_category

            // If both assets have the same emode category, use it
            if (supplyEmode === borrowEmode && supplyEmode > 0) {
                return supplyEmode
            }
        }

        // Default to no emode
        return 0
    }, [assetDetails])

    const txBtnStatus: Record<string, string> = {
        pending:
            loopTx.status === 'approve'
                ? 'Approving token...'
                : loopTx.status === 'check_strategy'
                ? 'Checking strategy...'
                : loopTx.status === 'create_strategy'
                ? 'Creating strategy...'
                : 'Opening position...',
        confirming: 'Confirming...',
        success: 'Close',
        default: 'Start Looping',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isConfirmed: boolean
    ) => {
        return txBtnStatus[
            loopTx.isConfirming
                ? 'confirming'
                : loopTx.isConfirmed && loopTx.status === 'view'
                    ? 'success'
                    : loopTx.isPending
                        ? 'pending'
                        : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    // Update the loopTx state based on the transaction status
    useEffect(() => {
        setLoopTx((prev: TLoopTx) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed, setLoopTx])


    // Check wallet connection before executing any transaction
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

    // Helper function to handle transaction errors
    const handleTransactionError = useCallback((error: any, status: string) => {
        const isUserRejection = error?.message?.includes('User rejected') ||
            error?.message?.includes('user rejected') ||
            error?.code === 4001 ||
            error?.code === 'ACTION_REJECTED'

        if (isUserRejection) {
            console.log(`User rejected transaction at step: ${status}`)
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

    // Use useReadContract to check for existing strategy
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

    // Step 4: Open position through strategy contract
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
    }, [
        strategyAddress, 
        walletAddress, 
        setLoopTx, 
        writeContractAsync, 
        handleTransactionError
    ])

    // Step 2: Approve yield token to strategy contract
    const onApproveSupply = useCallback(async (strategyAddr: string) => {
        if (!checkWalletConnection()) return

        try {
            if (!strategyAddr) {
                throw new Error('No strategy address available for approval')
            }

            const decimals = assetDetailsRef.current?.supplyAsset?.token?.decimals ?? 18
            const lendAmountToApprove = amountRef.current?.lendAmount?.toString() ?? '0'
            
            // If lendAmount is 0 or empty, skip approval and go directly to position opening
            if (Number(lendAmountToApprove) === 0 || lendAmountToApprove === '') {
                console.log('Skipping approval - no new collateral to approve (leverage-only change)')
                
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'approve',
                    hash: 'approval_skipped',
                    approveHash: 'approval_skipped',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                }))
                
                // Wait a bit to show the skipped status, then proceed to open position
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

            // Round the amount to the token's decimal places to avoid precision errors
            const roundedAmount = Number(lendAmountToApprove).toFixed(decimals)
            const parsedLendAmountBn = parseUnits(roundedAmount, decimals)
            const approveAmount = parsedLendAmountBn.toBigInt()

            logEvent('approve_loop_initiated', {
                amount: amountRef.current?.lendAmount ?? '0',
                token_symbol: assetDetailsRef.current?.supplyAsset?.token?.symbol ?? '',
                platform_name: assetDetailsRef.current?.name ?? '',
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetailsRef.current?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            console.log('Approving token to strategy:', strategyAddr, 'Amount:', roundedAmount)

            try {
                // 1) Try a direct approve first – many tokens allow increasing directly
                await writeContractAsync({
                    address: underlyingAssetAdress,
                    abi: AAVE_APPROVE_ABI,
                    functionName: 'approve',
                    args: [strategyAddr, approveAmount],
                })
            } catch (directError: any) {
                console.warn('Direct approve failed, attempting safeApprove reset-flow', directError?.message)

                // 2) reset allowance to 0 (required by non-standard ERC-20 tokens)
                await writeContractAsync({
                    address: underlyingAssetAdress,
                    abi: AAVE_APPROVE_ABI,
                    functionName: 'approve',
                    args: [strategyAddr, BigInt(0)],
                })

                // 3) approve desired amount
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
    }, [
        walletAddress,
        underlyingAssetAdress,
        logEvent,
        setLoopTx,
        writeContractAsync,
        onOpenPosition,
        handleTransactionError
    ])
    
    // Step 3: Create strategy (only if needed)
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

            console.log('Strategy creation transaction sent')

        } catch (error: any) {
            console.error('onCreateStrategy error', error)
            handleTransactionError(error, 'create_strategy')
        }
    }, [
        walletAddress,
        poolContractAddress,
        eModeValue,
        setLoopTx,
        writeContractAsync,
        onApproveSupply,
        handleTransactionError
    ])
    
    // Step 1: Check if user has existing strategy
    const onCheckStrategy = useCallback(async () => {
        if (!checkWalletConnection()) return

        try {
            console.log('Checking existing strategy with eMode:', eModeValue)
            
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'check_strategy',
                hash: '',
                errorMessage: '',
                isPending: true,
                isConfirming: false,
                isConfirmed: false,
            }))

            // Simulate checking process with a small delay
            await new Promise(resolve => setTimeout(resolve, 800))

            // Check for existing strategy
            const { data: existingStrategy } = await refetchStrategy()
            
            if (existingStrategy && existingStrategy !== '0x0000000000000000000000000000000000000000') {
                // Strategy exists, use it
                setStrategyAddress(existingStrategy as string)
                setHasExistingStrategy(true)
                console.log('Found existing strategy:', existingStrategy)
                
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'check_strategy',
                    hash: 'strategy_found',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                }))
                
                // Wait a bit to show the success message, then proceed to approval
                setTimeout(async () => {
                    await onApproveSupply(existingStrategy as string)
                }, 1500)
            } else {
                // No strategy exists, will create one
                setHasExistingStrategy(false)
                console.log('No existing strategy found, will create new one')
                
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    status: 'check_strategy',
                    hash: 'check_complete',
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                }))
                
                // Wait a bit to show the success message, then proceed to create strategy
                setTimeout(async () => {
                    await onCreateStrategy()
                }, 1500)
            }
            
        } catch (error: any) {
            console.error('onCheckStrategy error', error)
            handleTransactionError(error, 'check_strategy')
        }
    }, [
        walletAddress,
        refetchStrategy,
        eModeValue,
        setLoopTx,
        onApproveSupply,
        onCreateStrategy,
        handleTransactionError
    ])

    // Handle transaction completion and progression
    useEffect(() => {
        if (!hash || !isConfirmed || isPending || isConfirming) return

        const handleTransactionCompletion = async () => {
            if (loopTx.status === 'approve' && !isApproved) {
                setIsApproved(true) // Prevent re-triggering
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    approveHash: hash,
                    hash: '', // Clear hash to prevent re-triggering
                }))
                
                // Wait a bit to show approval success, then move to open position
                setTimeout(async () => {
                    setLoopTx((prev: TLoopTx) => ({
                        ...prev,
                        status: 'open_position',
                    }))
                    await onOpenPosition()
                }, 1500)

            } else if (loopTx.status === 'create_strategy') {
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    hash: '', // Clear hash
                }))
                
                // Wait a bit to show strategy creation success, then move to approval
                setTimeout(async () => {
                    // Refetch strategy address after creation
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
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetailsRef.current?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })
                
                setIsProcessingFlow(false)
            }
        }

        handleTransactionCompletion()
    }, [hash, isConfirmed, isPending, isConfirming, loopTx.status, onOpenPosition, onApproveSupply, refetchStrategy, setLoopTx, logEvent, walletAddress, isApproved])

    // Handle transaction cancellation/failure - only for actual blockchain transactions
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
            !loopTx.hash // Don't trigger cancellation if we have a success hash
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

    // Handle the SC interaction - Single button starts the entire flow
    const handleSCInteraction = useCallback(async () => {
        console.log('Loop button clicked - Starting automated flow with eMode:', eModeValue)

        if (!checkWalletConnection()) return

        if (loopTx.status === 'view') {
            handleCloseModal(false)
            return
        }

        // Clear any previous error message
        if (loopTx.errorMessage) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                errorMessage: '',
            }))
        }

        // Set processing flag
        setIsProcessingFlow(true)

        // Start the automated flow
        try {
            // Reset to start of flow
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'check_strategy',
                hash: '',
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: '',
            }))
            setIsApproved(false) // Reset approval flag

            // Start with strategy check
            await onCheckStrategy()
        } catch (error: any) {
            console.error('Error starting loop flow:', error)
            handleTransactionError(error, 'check_strategy')
        }
    }, [loopTx.status, loopTx.errorMessage, isWalletConnected, walletAddress, eModeValue, onCheckStrategy, handleTransactionError, handleCloseModal, setLoopTx])

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <CustomAlert
                    description={getErrorText(error)}
                />
            )}
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
