import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    BaseError,
    useAccount,
    useConnect,
    useWaitForTransactionReceipt,
    useWriteContract,
} from 'wagmi'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
// import { getActionName } from '@/lib/getActionName'
// import { Action } from '@/types/assetsTable'
// import { AddressType } from '@/types/address'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
import {
    APPROVE_MESSAGE,
    CHAIN_ID_MAPPER,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { TLendTx, TLoopTx, TTxContext, useTxContext } from '@/context/tx-provider'
import CustomAlert from '@/components/alerts/CustomAlert'
import { ArrowRightIcon } from 'lucide-react'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { ETH_ADDRESSES } from '@/lib/constants'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { TScAmount } from '@/types'
import { useAuth } from '@/context/auth-provider'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import CREDIT_DELEGATION_ABI from '@/data/abi/creditDelegationABI.json'
import LOOPING_LEVERAGE_ABI from '@/data/abi/loopingLeverageABI.json'

interface ILoopButtonProps {
    assetDetails: any
    disabled: boolean
    poolContractAddress: `0x${string}`
    underlyingAssetAdress: `0x${string}`
    amount: TScAmount
    decimals: number
    handleCloseModal: (isVisible: boolean) => void
}

const LoopButton = ({
    assetDetails,
    poolContractAddress,
    underlyingAssetAdress,
    amount,
    decimals,
    disabled,
    handleCloseModal,
}: ILoopButtonProps) => {
    const { logEvent } = useAnalytics()
    const { isWalletConnected, walletAddress } = useWalletConnection()
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            confirmations: 2,
            hash,
        })
    const { loopTx, setLoopTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()
    const LOOPING_SC_LEVERAGE_ADDRESS = '0x061709cf0396c598063ca80001d1aafaa7d39f2b'
    const DEBT_TOKENS: Record<string, string> = {
        '0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9':
            '0x904a51d7b418d8d5f3739e421a6ed532d653f625',
        '0x2c03058c8afc06713be23e58d2febc8337dbfe6a':
            '0xf9279419830016c87be66617e6c5ea42a7204460',
        '0xbfc94cd2b1e55999cfc7347a9313e88702b83d0f':
            '0x87c4d41c0982f335e8eb6be30fd2ae91a6de31fb',
        '0xfc24f770f94edbca6d6f885e12d4317320bcb401':
            '0x2bc84b1f1e1b89521de08c966be1ca498f97a493',
        '0xc9b53ab2679f573e480d01e0f49e2b5cfb7a3eab':
            '0x1504d006b80b1616d2651e8d15d5d25a88efef58',
    };
    const debtToken = DEBT_TOKENS[assetDetails.borrowAsset.token.address]

    // const amountBN = useMemo(() => {
    //     return amount ? BigNumber.from(amount.amountRaw) : BigNumber.from(0)
    // }, [amount])

    const txBtnStatus: Record<string, string> = {
        pending:
            loopTx.status === 'approve'
                ? 'Approving token...'
                : 'Looping token...',
        confirming: 'Confirming...',
        success: 'Close',
        default:
            loopTx.status === 'approve' ? 'Start looping' : 'Loop token',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isConfirmed: boolean
    ) => {
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isConfirmed
                    ? loopTx.status === 'view'
                        ? 'success'
                        : 'default'
                    : isPending
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
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    // Update the loopTx hash based on the transaction status
    useEffect(() => {
        if (
            (loopTx.status === 'approve') && hash && isConfirmed && !isPending && !isConfirming
        ) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'credit_delegation',
                hash: hash || '',
            }))
            return
        }
        if (
            (loopTx.status === 'credit_delegation') && hash && isConfirmed && !isPending && !isConfirming
        ) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                hash: hash || '',
                status: 'loop',
            }))
            return
        }
        if (loopTx.status === 'view' && hash && isConfirmed && !isPending && !isConfirming) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                hash: hash || '',
                status: 'view',
            }))

            logEvent('loop_completed', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })
            return
        }
    }, [hash, loopTx.status, isConfirmed, isPending, isConfirming])

    // Trigger the credit deligation or loop function based on loopTx.status
    useEffect(() => {
        if (loopTx.status === 'credit_delegation' && !ETH_ADDRESSES.includes(underlyingAssetAdress)) {
            onCreditDeligation()
            return
        }
        if (loopTx.status === 'loop' && ETH_ADDRESSES.includes(underlyingAssetAdress)) {
            onLoop()
            return
        }
    }, [loopTx.status])

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
            return false
        }
        return true
    }

    // Approve the supply token
    const onApproveSupply = async () => {
        if (!checkWalletConnection()) return

        const decimals = assetDetails?.supplyAsset?.token?.decimals ?? 18
        const parsedLendAmount = parseUnits(amount?.lendAmount?.toString() ?? '0', decimals)

        try {
            logEvent('approve_loop_initiated', {
                amount: (amount?.lendAmount ?? '0'),
                token_symbol: assetDetails?.asset?.token?.symbol ?? '',
                platform_name: assetDetails?.name ?? '',
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            await writeContractAsync({
                address: underlyingAssetAdress,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [LOOPING_SC_LEVERAGE_ADDRESS, parsedLendAmount],
            })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: error?.message?.includes('ConnectorNotConnectedError')
                    ? 'Wallet connection lost. Please reconnect your wallet and try again.'
                    : '',
            }))
            console.log('onApproveSupply error', error)
        }
    }

    // Credit deligation function
    const onCreditDeligation = async () => {
        if (!checkWalletConnection()) return

        const decimals = assetDetails?.borrowAsset?.token?.decimals ?? 18
        const parsedBorrowAmount = parseUnits(amount?.borrowAmount?.toString() ?? '0', decimals)

        try {
            logEvent('credit_delegation_initiated', {
                amount: (amount?.borrowAmount ?? '0'),
                token_symbol: assetDetails?.borrowAsset?.token?.symbol ?? '',
                platform_name: assetDetails?.name ?? '',
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'credit_delegation',
                hash: '',
                errorMessage: '',
            }))

            await writeContractAsync({
                address: debtToken as `0x${string}`,
                abi: CREDIT_DELEGATION_ABI,
                functionName: 'approveDelegation',
                args: [LOOPING_SC_LEVERAGE_ADDRESS, parsedBorrowAmount],
            })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: error?.message?.includes('ConnectorNotConnectedError')
                    ? 'Wallet connection lost. Please reconnect your wallet and try again.'
                    : '',
            }))
            console.log('onCreditDeligation error', error)
        }
    }

    // Loop function
    const onLoop = async () => {
        if (!checkWalletConnection()) return

        const supplyToken = assetDetails?.supplyAsset?.token?.address ?? ''
        const borrowToken = assetDetails?.borrowAsset?.token?.address ?? ''
        const supplyAmount = parseUnits(amount?.lendAmount?.toString() ?? '0', assetDetails?.supplyAsset?.token?.decimals ?? 18)
        const flashLoanAmount = parseUnits(amount?.flashLoanAmount?.toString() ?? '0', assetDetails?.borrowAsset?.token?.decimals ?? 18)
        const pathTokens: string[] = assetDetails?.pathTokens ?? []
        const pathFees: string[] = assetDetails?.pathFees ?? []

        // console.log('LOOPING_SC_LEVERAGE_ADDRESS', LOOPING_SC_LEVERAGE_ADDRESS)
        // console.log('supplyToken', supplyToken)
        // console.log('borrowToken', borrowToken)
        // console.log('supplyAmount', supplyAmount)
        // console.log('flashLoanAmount', flashLoanAmount)
        // console.log('pathTokens', pathTokens)
        // console.log('pathFees', pathFees)

        try {
            await writeContractAsync({
                address: LOOPING_SC_LEVERAGE_ADDRESS,
                abi: LOOPING_LEVERAGE_ABI,
                functionName: 'loop',
                args: [supplyToken, borrowToken, supplyAmount, flashLoanAmount, pathTokens, pathFees],
            })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                errorMessage: error?.message?.includes('ConnectorNotConnectedError')
                    ? 'Wallet connection lost. Please reconnect your wallet and try again.'
                    : '',
            }))
            console.log('onLoop error', error)
        }
    }

    // Handle the SC interaction
    const handleSCInteraction = useCallback(() => {
        if (!checkWalletConnection()) return

        if (loopTx.status === 'approve') {
            onApproveSupply()
        } else if (loopTx.status === 'credit_delegation') {
            onCreditDeligation()
        } else if (loopTx.status === 'loop') {
            onLoop()
        } else {
            handleCloseModal(false)
        }
    }, [loopTx.status, isWalletConnected, walletAddress])

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            )}
            {loopTx.errorMessage.length > 0 && (
                <CustomAlert description={loopTx.errorMessage} />
            )}
            <Button
                disabled={isPending || isConfirming || disabled || !isWalletConnected}
                onClick={handleSCInteraction}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {!isWalletConnected ? 'Connect Wallet' : txBtnText}
                {loopTx.status !== 'view' && !isPending && !isConfirming && isWalletConnected && (
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
