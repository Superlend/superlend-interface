import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    BaseError,
    useAccount,
    useWaitForTransactionReceipt,
    useWriteContract,
} from 'wagmi'
import { parseUnits } from 'ethers/lib/utils'
import {
    APPROVE_MESSAGE,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import CustomAlert from '@/components/alerts/CustomAlert'
import {
    TLendBorrowTxContext,
    TLendTx,
    useLendBorrowTxContext,
} from '@/context/lend-borrow-tx-provider'
import { BigNumber } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import { Market } from '@morpho-org/blue-sdk'
import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'

interface ISupplyMorphoButtonProps {
    disabled: boolean
    asset: any // Replace with proper type
    amount: string
    handleCloseModal: (isVisible: boolean) => void
}

const SupplyMorphoButton = ({
    disabled,
    asset,
    amount,
    handleCloseModal,
}: ISupplyMorphoButtonProps) => {
    const assetDetails = asset.asset
    const platform = asset.platform
    const morphoMarketData: Market = asset.morphoMarketData
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
    const { address: walletAddress } = useAccount()
    const { lendTx, setLendTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext

    const amountBN = useMemo(() => {
        return amount
            ? parseUnits(amount, assetDetails?.token?.decimals || 18)
            : BigNumber.from(0)
    }, [amount, assetDetails?.token?.decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            lendTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: 'Close',
        default: lendTx.status === 'approve' ? 'Approve token' : 'Lend token',
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
                  ? lendTx.status === 'view'
                      ? 'success'
                      : 'default'
                  : isPending
                    ? 'pending'
                    : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, isConfirming, isConfirmed)

    const supply = useCallback(async () => {
        try {
            setLendTx((prev: any) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            //  check if asset is collateral or borrow
            // If collateral, supplyCollateral if borrowSupply supply
            const isCollateral = !assetDetails.borrow_enabled

            if (isCollateral) {
                // call morpho market supplyCollateral
                writeContractAsync({
                    address: platform.core_contract,
                    abi: MORPHO_MARKET_ABI,
                    functionName: 'supplyCollateral',

                    // marketParams
                    // assets
                    // onBehalf
                    // data
                    args: [
                        {
                            loanToken: morphoMarketData.params.loanToken,
                            collateralToken:
                                morphoMarketData.params.collateralToken,
                            oracle: morphoMarketData.params.oracle,
                            irm: morphoMarketData.params.irm,
                            lltv: morphoMarketData.params.lltv,
                        },
                        parseUnits(amount, assetDetails.token.decimals),
                        walletAddress,
                        '0x',
                    ],
                })
                    .then((data) => {
                        setLendTx((prev: TLendTx) => ({
                            ...prev,
                            status: 'view',
                            errorMessage: '',
                        }))
                    })
                    .catch((error) => {
                        setLendTx((prev: TLendTx) => ({
                            ...prev,
                            isPending: false,
                            isConfirming: false,
                        }))
                    })
            } else {
                // call morpho market supply
                writeContractAsync({
                    address: platform.core_contract,
                    abi: MORPHO_MARKET_ABI,
                    functionName: 'supply',
                    args: [
                        {
                            loanToken: morphoMarketData.params.loanToken,
                            collateralToken:
                                morphoMarketData.params.collateralToken,
                            oracle: morphoMarketData.params.oracle,
                            irm: morphoMarketData.params.irm,
                            lltv: morphoMarketData.params.lltv,
                        },
                        parseUnits(amount, assetDetails.token.decimals),
                        0,
                        walletAddress,
                        '0x',
                    ],
                }).then((data) => {
                        setLendTx((prev: TLendTx) => ({
                            ...prev,
                            status: 'view',
                            errorMessage: '',
                        }))
                    })
                    .catch((error) => {
                        setLendTx((prev: TLendTx) => ({
                            ...prev,
                            isPending: false,
                            isConfirming: false,
                        }))
                    })
            }

            // TODO: Implement Morpho supply logic here
            // Example structure:
            // writeContractAsync({
            //     address: asset.core_contract,
            //     abi: MORPHO_POOL_ABI,
            //     functionName: 'supply',
            //     args: [
            //         asset.asset.token.address,
            //         parseUnits(amount, asset.asset.token.decimals),
            //         walletAddress,
            //         0,
            //     ],
            // })
        } catch (error) {
            error
        }
    }, [
        amount,
        assetDetails,
        platform,
        walletAddress,
        handleCloseModal,
        writeContractAsync,
    ])

    useEffect(() => {
        setLendTx((prev: any) => ({
            ...prev,
            isPending: isPending,
            isConfirming: isConfirming,
            isConfirmed: isConfirmed,
            isRefreshingAllowance: isConfirmed,
        }))
    }, [isPending, isConfirming, isConfirmed])

    useEffect(() => {
        if (lendTx.status === 'view') return

        if (!lendTx.isConfirmed && !lendTx.isPending && !lendTx.isConfirming) {
            if (lendTx.allowanceBN.gte(amountBN)) {
                setLendTx((prev: any) => ({
                    ...prev,
                    status: 'lend',
                    hash: '',
                    errorMessage: '',
                }))
            } else {
                setLendTx((prev: any) => ({
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: '',
                }))
            }
        }
    }, [lendTx.allowanceBN])

    useEffect(() => {
        if ((lendTx.status === 'approve' || lendTx.status === 'lend') && hash) {
            setLendTx((prev: any) => ({
                ...prev,
                hash: hash || '',
            }))
        }
        if (lendTx.status === 'view' && hash) {
            setLendTx((prev: any) => ({
                ...prev,
                hash: hash || '',
            }))
        }
    }, [hash, lendTx.status])

    const onApproveSupply = async () => {
        try {
            setLendTx((prev: any) => ({
                ...prev,
                status: 'approve',
                hash: '',
                errorMessage: '',
            }))

            // TODO: Implement Morpho approve logic here
            // Example structure:
            writeContractAsync({
                address: asset.asset.token.address,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [
                    platform.core_contract,
                    parseUnits(amount, asset.asset.token.decimals),
                ],
            })
        } catch (error) {
            error
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {lendTx.status === 'approve' && (
                <CustomAlert
                    variant="info"
                    hasPrefixIcon={false}
                    description={
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-secondary-500"
                        >
                            Note: You need to complete an &apos;approval
                            transaction&apos; granting Superlend smart contracts
                            permission to move funds from your wallet as the
                            first step before supplying the asset.
                            <a
                                href="https://eips.ethereum.org/EIPS/eip-2612"
                                target="_blank"
                                className="text-secondary-500 pb-[0.5px] border-b border-secondary-500 hover:border-secondary-200 ml-1"
                            >
                                Learn more
                            </a>
                            .
                        </BodyText>
                    }
                />
            )}
            {error && (
                <CustomAlert
                    description={
                        error && error.message
                            ? getErrorText(error)
                            : SOMETHING_WENT_WRONG_MESSAGE
                    }
                />
            )}
            {lendTx.errorMessage.length > 0 && (
                <CustomAlert description={lendTx.errorMessage} />
            )}
            <Button
                disabled={isPending || isConfirming || disabled}
                onClick={() => {
                    if (lendTx.status === 'approve') {
                        onApproveSupply()
                    } else if (lendTx.status === 'lend') {
                        supply()
                    } else {
                        handleCloseModal(false)
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {lendTx.status !== 'view' && !isPending && !isConfirming && (
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

export default SupplyMorphoButton
