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
    const { walletAddress } = useWalletConnection()
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

    // Trigger the credit deligation or loop function based on loopTx.status
    useEffect(() => {
        if (loopTx.status === 'credit_deligation' && !ETH_ADDRESSES.includes(underlyingAssetAdress)) {
            onCreditDeligation()
        }
        if (loopTx.status === 'loop' && ETH_ADDRESSES.includes(underlyingAssetAdress)) {
            onLoop()
        }
    }, [loopTx.status])

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
            (loopTx.status === 'approve' || loopTx.status === 'loop') &&
            hash
        ) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (loopTx.status === 'view' && hash) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                hash: hash || '',
            }))

            logEvent('loop_completed', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })
        }
    }, [hash, loopTx.status])

    // Approve the supply token
    const onApproveSupply = async () => {
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

            writeContractAsync({
                address: underlyingAssetAdress,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [LOOPING_SC_LEVERAGE_ADDRESS, (amount?.lendAmount ?? '0')],
            }).catch((error) => {
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                }))
            })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
            }))
        }
    }

    // Credit deligation function
    const onCreditDeligation = async () => {
        try {
            logEvent('credit_deligation_initiated', {
                amount: (amount?.borrowAmount ?? '0'),
                token_symbol: assetDetails?.borrowAsset?.token?.symbol ?? '',
                platform_name: assetDetails?.name ?? '',
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                status: 'credit_deligation',
                hash: '',
                errorMessage: '',
            }))

            writeContractAsync({
                address: debtToken as `0x${string}`,
                abi: CREDIT_DELEGATION_ABI,
                functionName: 'approveDelegation',
                args: [LOOPING_SC_LEVERAGE_ADDRESS, (amount?.borrowAmount ?? '0')],
            }).catch((error) => {
                setLoopTx((prev: TLoopTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                }))
            })
        } catch (error: any) {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: SOMETHING_WENT_WRONG_MESSAGE,
            }))
        }
    }

    // Loop function
    const onLoop = async () => {
        const supplyToken = assetDetails?.asset?.token?.address ?? ''
        const borrowToken = assetDetails?.borrowAsset?.token?.address ?? ''
        const supplyAmount = amount?.lendAmount ?? '0'
        const flashLoanAmount = amount?.flashLoanAmount ?? '0'
        const pathTokens: string[] = []
        const pathFees: string[] = []

        writeContractAsync({
            address: LOOPING_SC_LEVERAGE_ADDRESS,
            abi: LOOPING_LEVERAGE_ABI,
            functionName: 'loop',
            args: [supplyToken, borrowToken, supplyAmount, flashLoanAmount, pathTokens, pathFees],
        }).catch((error) => {
            setLoopTx((prev: TLoopTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
            }))
        })
    }

    // Handle the SC interaction
    const handleSCInteraction = useCallback(() => {
        if (loopTx.status === 'approve') {
            onApproveSupply()
        } else if (loopTx.status === 'credit_deligation') {
            onCreditDeligation()
        } else if (loopTx.status === 'loop') {
            onLoop()
        } else {
            handleCloseModal(false)
        }
    }, [loopTx.status])

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
                disabled={isPending || isConfirming || disabled}
                onClick={handleSCInteraction}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {loopTx.status !== 'view' && !isPending && !isConfirming && (
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
