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
    CHAIN_ID_MAPPER,
    CONFIRM_ACTION_IN_WALLET_TEXT,
    EIP_20_SIGNED_APPROVALS_LINK,
    ERROR_TOAST_ICON_STYLES,
    MORPHO_ETHERSCAN_TUTORIAL_LINK,
    MORPHO_WEBSITE_LINK,
    SOMETHING_WENT_WRONG_MESSAGE,
    SUCCESS_MESSAGE,
} from '@/constants'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import CustomAlert from '@/components/alerts/CustomAlert'
import { TTxContext, TLendTx, useTxContext } from '@/context/tx-provider'
import { BigNumber, ethers } from 'ethers'
import { getErrorText } from '@/lib/getErrorText'
import { BodyText } from '@/components/ui/typography'
import AAVE_APPROVE_ABI from '@/data/abi/aaveApproveABI.json'
import GENERAL_ADAPTER_ABI from '@/data/abi/morphoGeneralAdapterABI.json'
import { DEFAULT_SLIPPAGE_TOLERANCE, Market, Vault } from '@morpho-org/blue-sdk'
import MORPHO_MARKET_ABI from '@/data/abi/morphoMarketABI.json'
import MORPHO_BUNDLER_ABI from '@/data/abi/morphoBundlerABI.json'
import {
    BUNDLER_ADDRESS_MORPHO,
    GENERAL_ADAPTER_ADDRESS,
    MORPHO_BLUE_API_CHAINIDS,
} from '@/lib/constants'

import { BundlerAction } from '@morpho-org/morpho-blue-bundlers/pkg'
import ExternalLink from '@/components/ExternalLink'
import { PlatformType } from '@/types/platform'
import { TPositionType, TScAmount } from '@/types'
import { ChainId } from '@/types/chain'
import { useAnalytics } from '@/context/amplitude-analytics-provider'
import { useAuth } from '@/context/auth-provider'
import useLogNewUserEvent from '@/hooks/points/useLogNewUserEvent'
import { MathLib } from '@morpho-org/blue-sdk'
import { zeroHash } from 'viem'
import MORPHO_BUNDLER3_ABI from '@/data/abi/morphoBundler3ABI.json'
import { useTransactionStatus, getTransactionErrorMessage } from '@/hooks/useTransactionStatus'
import { humaniseWagmiError } from '@/lib/humaniseWagmiError'
interface ISupplyMorphoButtonProps {
    disabled: boolean
    assetDetails: any // Replace with proper type
    amount: TScAmount
    handleCloseModal: (isVisible: boolean) => void
    setActionType?: (actionType: TPositionType) => void
}

const SupplyMorphoButton = ({
    disabled,
    assetDetails,
    amount,
    handleCloseModal,
    setActionType,
}: ISupplyMorphoButtonProps) => {
    const { asset, morphoMarketData, ...platform } = assetDetails
    const tokenDetails = asset
    const isMorpho = platform.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !platform?.isVault
    const isMorphoVault = isMorpho && platform?.isVault
    const { logEvent } = useAnalytics()
    const { logUserEvent } = useLogNewUserEvent()
    const { accessToken, getAccessTokenFromPrivy } = useAuth()

    const {
        writeContractAsync,
        isPending,
        data: hash,
        error,
    } = useWriteContract()
    
    // Use the enhanced transaction status hook
    const txStatus = useTransactionStatus(hash, 1)
    
    const { address: walletAddress } = useAccount()
    const { lendTx, setLendTx } = useTxContext() as TTxContext
    // const amountBN = useMemo(() => {
    //     return amount
    //         ? parseUnits(amount, tokenDetails?.token?.decimals || 18)
    //         : BigNumber.from(0)
    // }, [amount, tokenDetails?.token?.decimals])

    const txBtnStatus: Record<string, string> = {
        pending:
            lendTx.status === 'approve'
                ? 'Approving token...'
                : 'Lending token...',
        confirming: 'Confirming...',
        success: isMorphoMarkets ? 'Go To Borrow' : 'Close',
        default:
            lendTx.status === 'approve'
                ? isMorphoMarkets
                    ? 'Start adding collateral'
                    : 'Start supplying'
                : isMorphoMarkets
                  ? 'Add Collateral'
                  : isMorphoVault
                    ? 'Supply to vault'
                    : 'Start earning',
    }

    const getTxButtonText = (
        isPending: boolean,
        isConfirming: boolean,
        isSuccessful: boolean
    ) => {
        return txBtnStatus[
            isConfirming
                ? 'confirming'
                : isSuccessful
                  ? lendTx.status === 'view'
                      ? 'success'
                      : 'default'
                  : isPending
                    ? 'pending'
                    : 'default'
        ]
    }

    const txBtnText = getTxButtonText(isPending, txStatus.isConfirming, txStatus.isSuccessful)

    useEffect(() => {
        getAccessTokenFromPrivy()
    }, [])

    useEffect(() => {
        if (lendTx.status === 'lend') {
            supply()
        }
    }, [lendTx.status])

    const supply = useCallback(async () => {
        try {
            setLendTx((prev: any) => ({
                ...prev,
                status: 'lend',
                hash: '',
                errorMessage: '',
            }))

            if (!walletAddress) {
                throw new Error('Wallet address is required')
            }

            const isVault = assetDetails.isVault

            if (isVault) {
                if (!MORPHO_BLUE_API_CHAINIDS.includes(assetDetails.chain_id)) {
                    await handleMorphoVaultSupply(
                        walletAddress,
                        assetDetails.chain_id
                    )
                } else {
                    await handleMorphoVaultSupplyLegacy(walletAddress)
                }
            } else {
                //  check if asset is collateral or borrow
                // If collateral, supplyCollateral if borrowSupply supply
                const isCollateral = !tokenDetails.borrow_enabled

                if (isCollateral) {
                    logEvent('add_collateral_initiated', {
                        amount: amount.amountRaw,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                        chain_name:
                            CHAIN_ID_MAPPER[
                                Number(assetDetails?.chain_id) as ChainId
                            ],
                        wallet_address: walletAddress,
                    })
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
                            amount.amountParsed,
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

                            logEvent('add_collateral_completed', {
                                amount: amount.amountRaw,
                                token_symbol:
                                    assetDetails?.asset?.token?.symbol,
                                platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                                chain_name:
                                    CHAIN_ID_MAPPER[
                                        Number(
                                            assetDetails?.chain_id
                                        ) as ChainId
                                    ],
                                wallet_address: walletAddress,
                            })
                        })
                        .catch((error) => {
                            setLendTx((prev: TLendTx) => ({
                                ...prev,
                                isPending: false,
                                isConfirming: false,
                            }))
                        })
                } else {
                    logEvent('lend_initiated', {
                        amount: amount.amountRaw,
                        token_symbol: assetDetails?.asset?.token?.symbol,
                        platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                        chain_name:
                            CHAIN_ID_MAPPER[
                                Number(assetDetails?.chain_id) as ChainId
                            ],
                        wallet_address: walletAddress,
                    })

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
                            amount.amountParsed,
                            0,
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

                            logEvent('lend_completed', {
                                amount: amount.amountRaw,
                                token_symbol:
                                    assetDetails?.asset?.token?.symbol,
                                platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                                chain_name:
                                    CHAIN_ID_MAPPER[
                                        Number(
                                            assetDetails?.chain_id
                                        ) as ChainId
                                    ],
                                wallet_address: walletAddress,
                            })
                        })
                        .catch((error) => {
                            setLendTx((prev: TLendTx) => ({
                                ...prev,
                                isPending: false,
                                isConfirming: false,
                            }))
                        })
                }
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
        } catch (error: any) {
            // Handle immediate errors (like user rejection)
            const errorMessage = humaniseWagmiError(error)
            setLendTx((prev: TLendTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
            }))
        }
    }, [amount, tokenDetails, platform, walletAddress, writeContractAsync])

    // Handle transaction success/failure
    useEffect(() => {
        if (txStatus.isSuccessful) {
            // Only set to 'view' if this was a supply transaction (not an approval)
            if (lendTx.status === 'lend') {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'view',
                    errorMessage: '',
                }))

                const isCollateral = !tokenDetails.borrow_enabled
                const eventType = isCollateral ? 'add_collateral_completed' : 'lend_completed'
                
                logEvent(eventType, {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })

                logUserEvent({
                    user_address: walletAddress as `0x${string}`,
                    event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                    platform_type: 'superlend_aggregator',
                    protocol_identifier: assetDetails?.protocol_identifier ?? assetDetails?.platform?.protocol_identifier,
                    event_data: 'SUPPLY',
                    authToken: accessToken || '',
                })
            } else if (lendTx.status === 'approve') {
                // For approval transactions, transition to 'lend' status to trigger supply
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'lend',
                    errorMessage: '',
                }))

                logEvent('approve_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                    wallet_address: walletAddress,
                })
            }
        } else if (txStatus.isFailed) {
            const errorMessage = getTransactionErrorMessage(txStatus.receipt) || 'Transaction failed'
            setLendTx((prev: TLendTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
            }))
        }
    }, [txStatus.isSuccessful, txStatus.isFailed, txStatus.receipt])

    useEffect(() => {
        setLendTx((prev: any) => ({
            ...prev,
            isPending: isPending,
            isConfirming: txStatus.isConfirming,
            isConfirmed: txStatus.isSuccessful,
            isRefreshingAllowance: txStatus.isSuccessful,
        }))
    }, [isPending, txStatus.isConfirming, txStatus.isSuccessful])

    useEffect(() => {
        if (lendTx.status === 'view') return

        if (!lendTx.isConfirmed && !lendTx.isPending && !lendTx.isConfirming) {
            if (lendTx.allowanceBN.gte(amount.amountParsed)) {
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

            logEvent('approve_initiated', {
                amount: amount.amountRaw,
                token_symbol: assetDetails?.asset?.token?.symbol,
                platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                chain_name:
                    CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
                wallet_address: walletAddress,
            })

            // TODO: Implement Morpho approve logic here
            // Example structure:
            writeContractAsync({
                address: assetDetails.asset.token.address,
                abi: AAVE_APPROVE_ABI,
                functionName: 'approve',
                args: [
                    assetDetails.isVault
                        ? !MORPHO_BLUE_API_CHAINIDS.includes(
                              assetDetails.chain_id
                          )
                            ? GENERAL_ADAPTER_ADDRESS[assetDetails.chain_id]
                            : BUNDLER_ADDRESS_MORPHO[assetDetails.chain_id]
                        : platform.core_contract,
                    amount.amountParsed,
                ],
            }).catch((error) => {
                console.log('Approve tx error: ', error)
            })
        } catch (error: any) {
            // Handle immediate errors (like user rejection)
            const errorMessage = humaniseWagmiError(error)
            setLendTx((prev: TLendTx) => ({
                ...prev,
                isPending: false,
                isConfirming: false,
                isConfirmed: false,
                errorMessage: errorMessage,
            }))
        }
    }

    const handleMorphoVaultSupplyLegacy = async (
        walletAddress: `0x${string}`
    ) => {
        const vault = morphoMarketData as Vault
        const shares = vault.toShares(BigInt(amount.amountParsed))

        const minAmount = BigNumber.from(shares).mul(99).div(100).toBigInt()

        const calls = [
            BundlerAction.erc20TransferFrom(
                vault.asset,
                BigInt(amount.amountParsed)
            ),
            BundlerAction.erc4626Deposit(
                vault.address,
                BigInt(amount.amountParsed),
                minAmount,
                walletAddress
            ),
        ]

        logEvent('lend_initiated', {
            amount: amount.amountRaw,
            token_symbol: assetDetails?.asset?.token?.symbol,
            platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
            chain_name:
                CHAIN_ID_MAPPER[Number(assetDetails?.chain_id) as ChainId],
            wallet_address: walletAddress,
        })

        writeContractAsync({
            address: BUNDLER_ADDRESS_MORPHO[
                assetDetails.chain_id
            ] as `0x${string}`,
            abi: MORPHO_BUNDLER_ABI,
            functionName: 'multicall',
            args: [calls],
        })
            .then((data) => {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'view',
                    errorMessage: '',
                }))

                logEvent('lend_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })

                logUserEvent({
                    user_address: walletAddress,
                    event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                    platform_type: 'superlend_aggregator',
                    protocol_identifier: assetDetails?.protocol_identifier ?? assetDetails?.platform?.protocol_identifier,
                    event_data: 'SUPPLY',
                    authToken: accessToken || '',
                })
            })
            .catch((error) => {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                }))
            })
    }

    const handleMorphoVaultSupply = async (
        walletAddress: `0x${string}`,
        chainId: number
    ) => {
        const vault = morphoMarketData as Vault
        const maxSharePriceE27 = vault.toAssets(
            (MathLib.WAD + DEFAULT_SLIPPAGE_TOLERANCE) * BigInt(10 ** 9)
        )

        const genAdapterInterface = new ethers.utils.Interface(
            GENERAL_ADAPTER_ABI
        )
        const generalAdapter = GENERAL_ADAPTER_ADDRESS[chainId]

        const tokenTransferCall = genAdapterInterface.encodeFunctionData(
            'erc20TransferFrom',
            [vault.asset, generalAdapter, BigInt(amount.amountParsed)]
        )
        const depositCall = genAdapterInterface.encodeFunctionData(
            'erc4626Deposit',
            [
                vault.address,
                BigInt(amount.amountParsed),
                maxSharePriceE27,
                walletAddress,
            ]
        )

        const calls = [
            {
                to: generalAdapter,
                data: tokenTransferCall,
                value: BigInt(0),
                skipRevert: false,
                callbackHash: zeroHash,
            },
            {
                to: generalAdapter,
                data: depositCall,
                value: BigInt(0),
                skipRevert: false,
                callbackHash: zeroHash,
            },
        ]

        logEvent('lend_initiated', {
            amount: amount.amountRaw,
            token_symbol: assetDetails?.asset?.token?.symbol,
            platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
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
        })
            .then((data) => {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    status: 'view',
                    errorMessage: '',
                }))

                logEvent('lend_completed', {
                    amount: amount.amountRaw,
                    token_symbol: assetDetails?.asset?.token?.symbol,
                    platform_name: assetDetails?.name ?? assetDetails?.platform?.name,
                    chain_name:
                        CHAIN_ID_MAPPER[
                            Number(assetDetails?.chain_id) as ChainId
                        ],
                    wallet_address: walletAddress,
                })

                logUserEvent({
                    user_address: walletAddress,
                    event_type: 'SUPERLEND_AGGREGATOR_TRANSACTION',
                    platform_type: 'superlend_aggregator',
                    protocol_identifier: assetDetails?.protocol_identifier ?? assetDetails?.platform?.protocol_identifier,
                    event_data: 'SUPPLY',
                    authToken: accessToken || '',
                })
            })
            .catch((error) => {
                setLendTx((prev: TLendTx) => ({
                    ...prev,
                    isPending: false,
                    isConfirming: false,
                }))
            })
    }

    return (
        <div className="flex flex-col gap-2">
            {lendTx.status === 'approve' && !assetDetails.isVault && (
                <CustomAlert
                    variant="info"
                    hasPrefixIcon={false}
                    description={
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-secondary-500"
                        >
                            Note: Adding collateral to Morpho Markets does not
                            yield.
                        </BodyText>
                    }
                />
            )}
            {/* {lendTx.status === 'approve' && (
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
                            transaction&apos; granting permission to move funds
                            from your wallet as the first step before supplying
                            the <span className="mr-1">asset.</span>
                            <ExternalLink href={EIP_20_SIGNED_APPROVALS_LINK}>
                                Learn more
                            </ExternalLink>
                            .
                        </BodyText>
                    }
                />
            )} */}
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
            {!morphoMarketData && (
                <CustomAlert
                    description={
                        <div className="flex flex-col items-start gap-2">
                            <BodyText level="body2" weight="medium">
                                Error: Service Unavailable
                            </BodyText>
                            <BodyText level="body2" weight="normal">
                                The Morpho API is temporarily down. Please try
                                again later.
                            </BodyText>
                            <ExternalLink
                                href={MORPHO_WEBSITE_LINK}
                                className="text-xs md:text-sm"
                            >
                                Morpho Website
                            </ExternalLink>
                        </div>
                    }
                />
            )}
            <Button
                disabled={
                    (isPending ||
                        txStatus.isConfirming ||
                        disabled ||
                        !morphoMarketData) &&
                    lendTx.status !== 'view'
                }
                onClick={() => {
                    if (lendTx.status === 'approve') {
                        onApproveSupply()
                    } else if (lendTx.status === 'lend') {
                        supply()
                    } else {
                        handleCloseModal(false)
                        setActionType?.('borrow')
                    }
                }}
                className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
                variant="primary"
            >
                {txBtnText}
                {lendTx.status !== 'view' && !isPending && !txStatus.isConfirming && (
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
