import {
    useWriteContract,
    useWaitForTransactionReceipt,
    type BaseError,
    useAccount,
} from 'wagmi'
// import { Action } from '../../../types/assetsTable'
// import { getActionName } from '@utils/getActionName'
// import CustomButton from '@components/ui/CustomButton'
import COMPOUND_ABI from '@/data/abi/compoundABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
import { useCallback, useEffect } from 'react'
// import { AddressType } from '../../../types/address'
// import { IAssetData } from '@interfaces/IAssetData'
import {
    CHAIN_ID_MAPPER,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    ERROR_TOAST_ICON_STYLES,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '../../../constants'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
// import { getErrorText } from '@utils/getErrorText'
import { countCompoundDecimals } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
// import { useActiveAccount } from 'thirdweb/react'
import CustomAlert from '@/components/alerts/CustomAlert'
import { TWithdrawTx, TTxContext, useTxContext } from '@/context/tx-provider'
import { ArrowRightIcon } from 'lucide-react'
import { getMaxAmountAvailableToBorrow } from '@/lib/getMaxAmountAvailableToBorrow'
import {
    DEFAULT_SLIPPAGE_TOLERANCE,
    Market,
    MathLib,
    Vault,
} from '@morpho-org/blue-sdk'
import { BundlerAction } from '@morpho-org/morpho-blue-bundlers/pkg'
import { walletActions, zeroHash } from 'viem'
import {
    BUNDLER_ADDRESS_MORPHO,
    ETH_ADDRESSES,
    GENERAL_ADAPTER_ADDRESS,
    MORPHO_BLUE_API_CHAINIDS,
} from '@/lib/constants'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import MORPHO_BUNDLER_ABI from '@/data/abi/morphoBundlerABI.json'
import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import FLUID_LEND_ABI from '@/data/abi/fluidLendABI.json'
import FLUID_VAULTS_ABI from '@/data/abi/fluidVaultsABI.json'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { BigNumber, ethers } from 'ethers'
import { TScAmount } from '@/types'
import { humaniseWagmiError } from '@/lib/humaniseWagmiError'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import { useAuth } from '@/context/auth-provider'
import GENERAL_ADAPTER_ABI from '@/data/abi/morphoGeneralAdapterABI.json'
import MORPHO_BUNDLER3_ABI from '@/data/abi/morphoBundler3ABI.json'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
interface IWithdrawButtonProps {
    disabled: boolean
    assetDetails: any
    amount: TScAmount
    handleCloseModal: (isVisible: boolean) => void
}

const WithdrawButton = ({
    disabled,
    assetDetails,
    amount,
    handleCloseModal,
}: IWithdrawButtonProps) => {
    const { logEvent } = useAnalytics()
    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    
    // Use the enhanced transaction status hook
    const txStatus = useTransactionStatus(hash)
    
    const { walletAddress } = useWalletConnection()
    const { withdrawTx, setWithdrawTx } = useTxContext() as TTxContext
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()
    // Protocol types
    const isCompound = assetDetails?.protocol_type === PlatformType.COMPOUND
    const isAave = assetDetails?.protocol_type === PlatformType.AAVE
    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoVault = isMorpho && !!assetDetails?.vault 
    const isMorphoMarket = isMorpho && !!assetDetails?.market
    const isFluid = assetDetails?.protocol_type === PlatformType.FLUID
    const isFluidVault = isFluid && assetDetails?.isVault
    const isFluidLend = isFluid && !assetDetails?.isVault

    const txBtnStatus: Record<string, string> = {
        pending: 'Withdrawing...',
        confirming: 'Confirming...',
        success: 'Close',
        error: 'Close',
        default: 'Start withdrawing',
    }

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])



    // Handle transaction success/failure
    useEffect(() => {
        if (txStatus.isSuccessful && withdrawTx.status !== 'view') {
            // Only set to 'view' if this was a withdraw transaction (not an approval)
            if (withdrawTx.status === 'withdraw') {
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    status: 'view',
                    hash: hash || '',
                    isConfirmed: true,
                }))

                logEvent('withdraw_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })

                logUserEvent({
                    user_address: walletAddress as `0x${string}`,
                    event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                    platform_type: 'superlend_aggregator',
                    protocol_identifier: assetDetails?.protocol_identifier,
                    event_data: 'WITHDRAW',
                    authToken: accessToken || '',
                })
            } else if (withdrawTx.status === 'approve') {
                // For approval transactions, transition to 'withdraw' status
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    status: 'withdraw',
                    hash: hash || '',
                    isConfirmed: true,
                }))

                logEvent('approve_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })
            } else {
                // For single-step withdrawals (non-Morpho vaults), set to view
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    status: 'view',
                    hash: hash || '',
                    isConfirmed: true,
                }))

                logEvent('withdraw_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })

                logUserEvent({
                    user_address: walletAddress as `0x${string}`,
                    event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                    platform_type: 'superlend_aggregator',
                    protocol_identifier: assetDetails?.protocol_identifier,
                    event_data: 'WITHDRAW',
                    authToken: accessToken || '',
                })
            }
        } else if (txStatus.isFailed && withdrawTx.status !== 'view') {
            const errorMessage = getTransactionErrorMessage(txStatus.receipt) || 'Transaction failed'
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
            }))
        }
    }, [txStatus.isSuccessful, txStatus.isFailed, txStatus.receipt, hash, amount, assetDetails, walletAddress, withdrawTx.status])

    // Update the status(Loading states) of the withdrawTx based on the isPending and txStatus states
    useEffect(() => {
        setWithdrawTx((prev: TWithdrawTx) => {
            // Only update if values have actually changed
            if (
                prev.isPending !== isPending ||
                prev.isConfirming !== txStatus.isConfirming ||
                prev.isConfirmed !== txStatus.isSuccessful ||
                prev.isRefreshingAllowance !== txStatus.isSuccessful
            ) {
                return {
                    ...prev,
                    isPending: isPending,
                    isConfirming: txStatus.isConfirming,
                    isConfirmed: txStatus.isSuccessful,
                    isRefreshingAllowance: txStatus.isSuccessful,
                }
            }
            return prev
        })
    }, [isPending, txStatus.isConfirming, txStatus.isSuccessful])

    const txBtnText =
        txBtnStatus[
            txStatus.isConfirming
                ? 'confirming'
                : txStatus.isSuccessful
                  ? withdrawTx.status === 'view'
                      ? 'success'
                      : 'default'
                  : isPending
                    ? 'pending'
                    : !isPending &&
                        !txStatus.isConfirming &&
                        !txStatus.isSuccessful &&
                        withdrawTx.status === 'view'
                      ? 'error'
                      : 'default'
        ]

    const withdrawMorphoMarket = useCallback(
        async (assetDetails: any, amount: TScAmount) => {
            try {
                const morphoMarketData = assetDetails?.market as Market
                let decimals = assetDetails.asset.token.decimals

                let amountToWithdraw = amount.amountParsed
                // parseUnits(amount, decimals)

                logEvent('withdraw_initiated', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })

                writeContractAsync({
                    address: assetDetails.core_contract as `0x${string}`,
                    abi: MORPHO_MARKET_ABI,
                    functionName: 'withdrawCollateral',
                    args: [
                        {
                            loanToken: morphoMarketData.params.loanToken,
                            collateralToken:
                                morphoMarketData.params.collateralToken,
                            oracle: morphoMarketData.params.oracle,
                            irm: morphoMarketData.params.irm,
                            lltv: morphoMarketData.params.lltv,
                        },
                        amountToWithdraw,
                        walletAddress,
                        walletAddress,
                    ],
                }).catch((error) => {
                    console.log('error', error)
                    // Handle immediate errors (like user rejection)
                    const errorMessage = humaniseWagmiError(error)
                    setWithdrawTx((prev: TWithdrawTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        errorMessage: errorMessage,
                    }))
                })
            } catch (error) {
                error
            }
        },
        []
    )

    const withdrawAave = useCallback(
        async (
            assetDetails: any,
            poolContractAddress: string,
            underlyingAssetAdress: string,
            amount: TScAmount,
            addressOfWallet: string
        ) => {
            try {
                logEvent('withdraw_initiated', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })
                writeContractAsync({
                    address: poolContractAddress as `0x${string}`,
                    abi: AAVE_POOL_ABI,
                    functionName: 'withdraw',
                    args: [
                        underlyingAssetAdress,
                        amount.amountParsed,
                        // parseUnits(amount, assetDetails.asset.token.decimals),
                        // 2,
                        // 0,
                        addressOfWallet,
                    ],
                }).catch((error) => {
                    // console.log('error', error)
                    setWithdrawTx((prev: TWithdrawTx) => ({
                        ...prev,
                        isPending: false,
                        isConfirming: false,
                        isConfirmed: false,
                        // errorMessage:
                        //     error.message ||
                        //     'Something went wrong, please try again',
                    }))
                })
            } catch (error: any) {
                // console.log('error outer catch', error)
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    // errorMessage:
                    //     error.message ||
                    //     'Something went wrong, please try again',
                }))
            }
        },
        [writeContractAsync, assetDetails, handleCloseModal]
    )

    const onApproveWithdrawMorphoVault = useCallback(async (
        assetDetails: any,
        amount: TScAmount
    ) => {
        setWithdrawTx((prev: TWithdrawTx) => {
            if (prev.status !== 'approve' || prev.hash !== '' || prev.errorMessage !== '') {
                return {
                    ...prev,
                    status: 'approve',
                    hash: '',
                    errorMessage: '',
                }
            }
            return prev
        })

        let vault = assetDetails?.vault as Vault
        let amountToWithdraw = amount.amountParsed

        let shareAmount = await vault.toShares(
            BigNumber.from(amountToWithdraw).toBigInt()
        )

        // apprive the vault.address to bunder
        let bunder_address = MORPHO_BLUE_API_CHAINIDS.includes(
            Number(assetDetails.chain_id)
        )
            ? BUNDLER_ADDRESS_MORPHO[assetDetails.chain_id]
            : GENERAL_ADAPTER_ADDRESS[assetDetails.chain_id]

        logEvent('approve_withdraw_initiated', {
            amount: amount.amountRaw,
            token_symbol: assetDetails?.asset?.token?.symbol,
            platform_name: assetDetails?.name,
            chain_name:
                CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
            wallet_address: walletAddress,
        })

        writeContractAsync({
            address: vault.address,
            abi: AAVE_APPROVE_ABI,
            functionName: 'approve',
            args: [bunder_address as `0x${string}`, shareAmount],
        }).catch((error) => {
            console.log('error', error)
        })
    }, [assetDetails, amount, walletAddress, logEvent, writeContractAsync])

    const withdrawMorphoVault = useCallback(
        async (assetDetails: any, amount: TScAmount) => {
            if (
                MORPHO_BLUE_API_CHAINIDS.includes(Number(assetDetails.chain_id))
            )
                await handleWithdrawMorphoVaultLegacy(assetDetails, amount)
            else await handleWithdrawMorphoVaultNew(assetDetails, amount)
        },
        []
    )

    const handleWithdrawMorphoVaultLegacy = async (
        assetDetails: any,
        amount: TScAmount
    ) => {
        let vault = assetDetails?.vault as Vault

        let amountToWithdraw = BigNumber.from(amount.amountParsed)
        // parseUnits(
        //     amount,
        //     assetDetails.asset.token.decimals
        // )

        // //  convert asset to share
        // TODO - Priyam: replicate this function somehow
        let shareAmount = vault.toShares(amountToWithdraw.toBigInt())

        // calculate 0.5% of the shareAmount
        let onePercentOfShareAmount =
            (shareAmount * BigInt(9900)) / BigInt(10000)

        shareAmount = shareAmount + onePercentOfShareAmount

        // apprive the vault.address to bunder
        let bunder_address = BUNDLER_ADDRESS_MORPHO[assetDetails.chain_id]

        let bunder_calls = [
            // BundlerAction.erc20TransferFrom(
            //     vault.address,
            //     shareAmount.toString(),
            // ),

            BundlerAction.erc4626Withdraw(
                vault.address, // TODO - Priyam: get this from other sources0x23055618898e202386e6c13955a58D3C68200BFB
                amountToWithdraw.toString(),
                shareAmount.toString(),
                walletAddress as string,
                walletAddress as string
            ),
        ]

        logEvent('withdraw_initiated', {
            amount: amount.amountRaw,
            token_symbol: assetDetails?.asset?.token?.symbol,
            platform_name: assetDetails?.name,
            chain_name:
                CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
            wallet_address: walletAddress,
        })

        writeContractAsync({
            address: bunder_address as `0x${string}`,
            abi: MORPHO_BUNDLER_ABI,
            functionName: 'multicall',
            args: [bunder_calls],
        }).catch((error) => {
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: error.message || 'Something went wrong',
            }))
        })
    }

    const handleWithdrawMorphoVaultNew = async (
        assetDetails: any,
        amount: TScAmount
    ) => {
        let vault = assetDetails?.vault as Vault

        let amountToWithdraw = BigNumber.from(amount.amountParsed)
        const genAdapterInterface = new ethers.utils.Interface(
            GENERAL_ADAPTER_ABI
        )
        const generalAdapter = GENERAL_ADAPTER_ADDRESS[assetDetails.chain_id]

        const withdrawCall = genAdapterInterface.encodeFunctionData(
            'erc4626Withdraw',
            [
                vault.address,
                amountToWithdraw.toString(),
                '0',
                walletAddress,
                walletAddress,
            ]
        )

        const calls = [
            {
                to: generalAdapter,
                data: withdrawCall,
                value: BigInt(0),
                skipRevert: false,
                callbackHash: zeroHash,
            },
        ]

        logEvent('withdraw_initiated', {
            amount: amount.amountRaw,
            token_symbol: assetDetails?.asset?.token?.symbol,
            platform_name: assetDetails?.name,
            chain_name:
                CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
            wallet_address: walletAddress,
        })

        writeContractAsync({
            address: BUNDLER_ADDRESS_MORPHO[
                assetDetails.chain_id
            ] as `0x${string}`,
            abi: MORPHO_BUNDLER3_ABI,
            functionName: 'multicall',
            args: [calls],
        }).catch((error) => {
            setWithdrawTx((prev: TWithdrawTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                // errorMessage: error.message || 'Something went wrong',
            }))
        })
    }

    const withdrawFluidLend = useCallback(
        async (assetDetails: any, amount: TScAmount) => {
            let amountToWithdraw = BigNumber.from(amount.amountParsed)

            const maxSharesBurn = amountToWithdraw.mul(10050).div(10000) // 0.5% slippage

            logEvent('withdraw_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: assetDetails.core_contract as `0x${string}`,
                abi: FLUID_LEND_ABI,
                functionName: 'withdraw',
                args: [
                    amountToWithdraw, // assets_: uint256
                    walletAddress, // receiver_: address
                    walletAddress, // owner_: address
                    maxSharesBurn, // maxSharesBurn_: uint256
                ],
            }).catch((error) => {
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    // errorMessage: error.message || 'Something went wrong',
                }))
            })
        },
        []
    )

    const withdrawFluidVault = useCallback(
        async (assetDetails: any, amount: TScAmount) => {
            let amountToWithdraw = amount.scValue

            logEvent('withdraw_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            writeContractAsync({
                address: assetDetails.core_contract as `0x${string}`,
                abi: FLUID_VAULTS_ABI,
                functionName: 'operate',
                args: [
                    assetDetails?.fluid_vault_nftId,
                    BigInt(amountToWithdraw),
                    0,
                    walletAddress,
                ],
            }).catch((error) => {
                setWithdrawTx((prev: TWithdrawTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                    isConfirmed: false,
                    // errorMessage: error.message || 'Something went wrong',
                }))
            })
        },
        []
    )

    const onWithdraw = useCallback(async () => {
        // if (isCompound) {
        //     await withdrawCompound(assetDetails?.asset?.token?.address, amount)
        //     return
        // }
        if (isAave) {
            await withdrawAave(
                assetDetails,
                assetDetails?.core_contract,
                assetDetails?.asset?.token?.address,
                amount,
                walletAddress as string
            )
            return
        }
        if (isMorphoVault) {
            await withdrawMorphoVault(assetDetails, amount)
            return
        }

        if (isMorphoMarket) {
            await withdrawMorphoMarket(assetDetails, amount)
            return
        }

        if (isFluidLend) {
            await withdrawFluidLend(assetDetails, amount)
            return
        }

        if (isFluidVault) {
            await withdrawFluidVault(assetDetails, amount)
            return
        }
    }, [isAave, isMorphoVault, isMorphoMarket, isFluidLend, isFluidVault, assetDetails, amount, walletAddress, withdrawAave, withdrawMorphoVault, withdrawMorphoMarket, withdrawFluidLend, withdrawFluidVault])

    useEffect(() => {
        if (withdrawTx.status === 'withdraw' && isMorphoVault && !withdrawTx.isPending && !withdrawTx.isConfirming && withdrawTx.isConfirmed) {
            onWithdraw()
        }
    }, [withdrawTx.status, isMorphoVault, withdrawTx.isPending, withdrawTx.isConfirming, withdrawTx.isConfirmed, onWithdraw])

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <CustomAlert
                    description={humaniseWagmiError(error)}
                />
            )}
            {(withdrawTx.errorMessage.length > 0 && !error) && (
                <CustomAlert description={withdrawTx.errorMessage} />
            )}
            <Button
                variant="primary"
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                disabled={isPending || txStatus.isConfirming || disabled}
                onClick={() => {
                    if (withdrawTx.status === 'approve') {
                        onApproveWithdrawMorphoVault(assetDetails, amount)
                    } else if (withdrawTx.status === 'withdraw') {
                        onWithdraw()
                    } else {
                        handleCloseModal(false)
                    }
                }}
            >
                {txBtnText}
                {withdrawTx.status !== 'view' &&
                    !isPending &&
                    !txStatus.isConfirming && (
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

export default WithdrawButton
