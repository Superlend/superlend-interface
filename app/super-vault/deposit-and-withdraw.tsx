'use client'

import ImageWithDefault from '@/components/ImageWithDefault'
import LendBorrowToggle from '@/components/LendBorrowToggle'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPositionType } from '@/types'
import { PlatformType, TPlatformAsset } from '@/types/platform'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CircleCheck,
    CircleCheckIcon,
    CircleXIcon,
    LoaderCircle,
    X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import { useSwitchChain } from 'wagmi'
import {
    abbreviateNumber,
    checkDecimalPlaces,
    decimalPlacesCount,
    getLowestDisplayValue,
    hasExponent,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { BodyText, HeadingText, Label } from '@/components/ui/typography'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import AAVE_POOL_ABI from '@/data/abi/aaveApproveABI.json'
import { Config, useAccount, useReadContract } from 'wagmi'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import LoadingSectionSkeleton from '@/components/skeletons/LoadingSection'
import {
    CHAIN_ID_MAPPER,
    POOL_BASED_PROTOCOLS,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
    TX_EXPLORER_LINKS,
} from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import {
    TDepositTx,
    TWithdrawTx,
    TTxContext,
    useTxContext,
} from '@/context/super-vault-tx-provider'
import { PlatformValue } from '@/types/platform'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import { useAaveV3Data } from '../../hooks/protocols/useAaveV3Data'
import { BigNumber } from 'ethers'
import { useUserTokenBalancesContext } from '@/context/user-token-balances-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { calculateHealthFactorFromBalancesBigUnits } from '@aave/math-utils'
import { valueToBigNumber } from '@aave/math-utils'
import CustomAlert from '@/components/alerts/CustomAlert'
import { Checkbox } from '@/components/ui/checkbox'
import useDimensions from '@/hooks/useDimensions'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
// import { modal } from '@/context'
import { polygon } from '@reown/appkit/networks'
import { ChainId } from '@/types/chain'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { usePrivy, useWallets } from '@privy-io/react-auth'

export default function DepositAndWithdrawAssets() {
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState<boolean>(false)

    // Render component
    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <LendBorrowToggle
                type={positionType}
                handleToggle={setPositionType}
                title={{ lend: 'Deposit', borrow: 'Withdraw' }}
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600"
                    >
                        {positionType === 'lend'
                            ? 'Deposit'
                            : `Withdraw`}
                    </BodyText>
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600 flex items-center gap-[4px]"
                    >
                        Bal:{' '}
                        [BALANCE]
                        {/* <span className="inline-block truncate max-w-[70px]">
                            [tokenSymbol]
                        </span> */}
                    </BodyText>
                    {/* <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600 flex items-center gap-[4px]"
                    >
                        limit:{' '}
                        [MAX_AMOUNT_TO_BORROW]
                    </BodyText> */}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div
                        className={cn(
                            true
                                ? 'border rounded-5 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]'
                                : 'border-t rounded-t-5',
                            'border-gray-200 py-[12px] px-[20px] flex items-center gap-[12px]'
                        )}
                    >
                        {/* {isLoading && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )} */}
                        {/* Lend position type - Selected token image */}
                        {/* {!isLoading && isLendPositionType(positionType) && ( */}
                        <ImageWithDefault
                            src={''}
                            alt={''}
                            className="shrink-0 w-[24px] h-[24px] rounded-full"
                            width={24}
                            height={24}
                        />
                        {/* )} */}
                        {/* Borrow position type - Select token dropdown */}
                        {/* {(isLoading ||
                            !selectedBorrowTokenDetails?.token?.address) &&
                            !isLendPositionType(positionType) && (
                                <LoaderCircle className="text-primary w-[60px] h-[34px] animate-spin" />
                            )} */}
                        {/* {!isLoading &&
                            !!selectedBorrowTokenDetails?.token?.address &&
                            !isLendPositionType(positionType) && (
                                <SelectTokensDropdown
                                    key={positionType}
                                    options={borrowTokensDetails}
                                    selectedItemDetails={
                                        selectedBorrowTokenDetails
                                    }
                                    setSelectedItemDetails={
                                        setSelectedBorrowTokenDetails
                                    }
                                />
                            )} */}
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-500"
                        >
                            |
                        </BodyText>
                        <div className="flex flex-col flex-1 gap-[4px]">
                            <CustomNumberInput
                                key={'true'}
                                amount={'10'}
                                setAmount={() => { }}
                            />
                        </div>
                        <Button
                            variant="link"
                            className="uppercase text-[14px] font-medium w-fit"
                        // onClick={() =>
                        //     setAmount(
                        //         isLendPositionType(positionType)
                        //             ? (balance ?? '0')
                        //             : (maxBorrowAmount ?? '0')
                        //     )
                        // }
                        // disabled={isDisabledMaxBtn()}
                        >
                            max
                        </Button>
                    </div>
                    {/* Net APY - ONLY FOR BORROW TAB */}
                    {/* {!isLendPositionType(positionType) && isWalletConnected && (
                        <div className="flex items-center justify-between w-full py-[12px] px-[24px] rounded-b-5 bg-white border-y border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)]">
                            <BodyText
                                level="body3"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Net APY
                            </BodyText>
                            {isLoadingMaxBorrowingAmount && (
                                <Skeleton className="w-[50px] h-[20px]" />
                            )}
                            {!isLoadingMaxBorrowingAmount && (
                                <Badge variant="green">
                                    {abbreviateNumber(
                                        isLendPositionType(positionType)
                                            ? Number(
                                                  assetDetails?.asset?.apy ?? 0
                                              )
                                            : Number(
                                                  selectedBorrowTokenDetails?.variable_borrow_apy ??
                                                      0
                                              )
                                    )}
                                    %
                                </Badge>
                            )}
                        </div>
                    )} */}
                    {/* {isWalletConnected && ( */}
                    {/* <div className="card-content-bottom max-md:px-2 py-3 max-w-[250px] mx-auto">
                            {isLoadingHelperText && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="w-full text-gray-500 text-center"
                                >
                                    {getLoadingHelperText()}
                                </BodyText>
                            )}
                            {!errorMessage && !isLoadingHelperText && (
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="w-full text-gray-500 text-center"
                                >
                                    {isLendPositionType(positionType)
                                        ? 'Enter amount to proceed with supplying collateral for this position'
                                        : 'Enter the amount you want to borrow from this position'}
                                </BodyText>
                            )}
                            {errorMessage &&
                                !isLoadingHelperText &&
                                !isLoadingErc20TokensBalanceData &&
                                !isLoadingMaxBorrowingAmount && (
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-center text-destructive-foreground"
                                    >
                                        {errorMessage}
                                    </BodyText>
                                )}
                        </div> */}
                    {/* )} */}
                </CardContent>
                <CardFooter className="p-0 justify-center">
                    {/* {!isWalletConnected && <ConnectWalletButton />} */}
                    {/* {isWalletConnected && !isLoading && ( */}
                    <div className="flex flex-col gap-[12px] w-full">
                        <ConfirmationDialog
                            disabled={false}
                            positionType={positionType}
                            assetDetails={
                                {}
                            }
                            amount={'10'}
                            balance={'10'}
                            maxBorrowAmount={'10'}
                            setAmount={() => { }}
                            healthFactorValues={
                                {
                                    healthFactor: 10,
                                    newHealthFactor: 10,
                                }
                            }
                            open={isConfirmationDialogOpen}
                            setOpen={setIsConfirmationDialogOpen}
                        />
                    </div>
                    {/* )} */}
                </CardFooter>
            </Card>
        </section>
    )
}

// Child components
function SelectTokensDropdown({
    options,
    selectedItemDetails,
    setSelectedItemDetails,
}: {
    options: TPlatformAsset[]
    selectedItemDetails: TPlatformAsset | null
    setSelectedItemDetails: (token: TPlatformAsset) => void
}) {
    useEffect(() => {
        setSelectedItemDetails(options[0])
    }, [])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="md"
                    variant="ghost"
                    className="group flex items-center gap-1 text-gray-800 px-0"
                >
                    <ImageWithDefault
                        src={selectedItemDetails?.token?.logo}
                        alt={selectedItemDetails?.token?.symbol}
                        width={24}
                        height={24}
                        className="rounded-full max-w-[24px] max-h-[24px]"
                    />
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
                <ScrollArea className="h-[200px]">
                    {options?.map((asset: any) => (
                        <DropdownMenuItem
                            key={asset?.token?.address}
                            onClick={() => setSelectedItemDetails(asset)}
                            className={cn(
                                'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
                                selectedItemDetails?.token?.address ===
                                asset?.token?.address && 'bg-gray-400'
                            )}
                        >
                            <ImageWithDefault
                                src={asset?.token?.logo || ''}
                                alt={asset?.token?.symbol || ''}
                                width={24}
                                height={24}
                                className="rounded-full max-w-[24px] max-h-[24px]"
                            />
                            <BodyText
                                level="body2"
                                weight="medium"
                                className="text-gray-800"
                            >
                                {asset?.token?.symbol || ''}
                            </BodyText>
                        </DropdownMenuItem>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function ConfirmationDialog({
    disabled,
    positionType,
    assetDetails,
    amount,
    setAmount,
    balance,
    maxBorrowAmount,
    healthFactorValues,
    isVault,
    open,
    setOpen,
    setActionType,
}: {
    disabled: boolean
    positionType: TPositionType
    assetDetails: any
    amount: string
    balance: string
    maxBorrowAmount: string
    setAmount: (amount: string) => void
    healthFactorValues: {
        healthFactor: any
        newHealthFactor: any
    }
    isVault?: boolean
    open: boolean
    setOpen: (open: boolean) => void
    setActionType?: (actionType: TPositionType) => void
}) {
    const { depositTx, setDepositTx, withdrawTx, setWithdrawTx } =
        useTxContext() as TTxContext
    const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false)
    const searchParams = useSearchParams()
    const chain_id = searchParams.get('chain_id') || 1
    const { width: screenWidth } = useDimensions()
    const isDesktop = screenWidth > 768
    const isTxFailed = isLendPositionType(positionType)
        ? depositTx.errorMessage.length > 0
        : withdrawTx.errorMessage.length > 0
    const isMorpho = assetDetails?.protocol_type === PlatformType.MORPHO
    const isMorphoMarkets = isMorpho && !assetDetails?.isVault
    const isMorphoVault = isMorpho && assetDetails?.isVault
    const { address: walletAddress } = useAccount()
    const { wallets } = useWallets()
    const wallet = wallets.find(
        (wallet: any) => wallet.address === walletAddress
    )

    useEffect(() => {
        // Reset the tx status when the dialog is closed
        return () => {
            resetDepositWithdrawTx()
        }
    }, [])

    useEffect(() => {
        setHasAcknowledgedRisk(false)

        async function handleSwitchChain() {
            // console.log('wallet', wallet)
            await wallet?.switchChain(Number(chain_id))
        }

        if (open) {
            // Switch chain when the dialog is opened
            // modal.switchNetwork(CHAIN_ID_MAPPER[Number(chain_id) as ChainId])
            handleSwitchChain()
        }
    }, [open])

    function resetDepositWithdrawTx() {
        setDepositTx((prev: TDepositTx) => ({
            ...prev,
            status: 'approve',
            hash: '',
            allowanceBN: BigNumber.from(0),
            isRefreshingAllowance: false,
            errorMessage: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
        }))
        setWithdrawTx((prev: TWithdrawTx) => ({
            ...prev,
            status: 'withdraw',
            hash: '',
            isPending: false,
            isConfirming: false,
            isConfirmed: false,
            errorMessage: '',
        }))
    }

    function handleOpenChange(open: boolean) {
        // When opening the dialog, reset the amount and the tx status
        setOpen(open)
        // When closing the dialog, reset the amount and the tx status
        if (
            !open &&
            (depositTx.status !== 'approve' || withdrawTx.status !== 'withdraw')
        ) {
            setAmount('')
            resetDepositWithdrawTx()
        }
    }

    function isShowBlock(status: { deposit: boolean; withdraw: boolean }) {
        return isLendPositionType(positionType) ? status.deposit : status.withdraw
    }

    const inputUsdAmount =
        Number(amount) * Number(assetDetails?.asset?.token?.price_usd)

    function handleInputUsdAmount(amount: string) {
        const amountFormatted = hasExponent(amount)
            ? Math.abs(Number(amount)).toFixed(10)
            : amount.toString()
        const amountFormattedForLowestValue = getLowestDisplayValue(
            Number(amountFormatted)
        )
        return `~${hasLowestDisplayValuePrefix(Number(amountFormatted))}$${amountFormattedForLowestValue}`
    }

    const isDepositTxInProgress = depositTx.isPending || depositTx.isConfirming
    const isWithdrawTxInProgress = withdrawTx.isPending || withdrawTx.isConfirming

    const isTxInProgress = isDepositTxInProgress || isWithdrawTxInProgress

    const depositTxSpinnerColor = depositTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const withdrawTxSpinnerColor = withdrawTx.isPending
        ? 'text-secondary-500'
        : 'text-primary'
    const txSpinnerColor = isLendPositionType(positionType)
        ? depositTxSpinnerColor
        : withdrawTxSpinnerColor

    const canDisplayExplorerLinkWhileLoading = isLendPositionType(positionType)
        ? depositTx.hash.length > 0 && (depositTx.isConfirming || depositTx.isPending)
        : withdrawTx.hash.length > 0 &&
        (withdrawTx.isConfirming || withdrawTx.isPending)

    function getNewHfColor() {
        const newHF = Number(healthFactorValues.newHealthFactor.toString())
        const HF = Number(healthFactorValues.healthFactor.toString())

        if (newHF < HF) {
            return 'text-danger-500'
        } else if (newHF > HF) {
            return 'text-success-500'
        } else {
            return 'text-warning-500'
        }
    }

    function isHfLow() {
        return (
            Number(healthFactorValues.newHealthFactor.toString()) < Number(1.5)
        )
    }

    const disableActionButton =
        disabled ||
        (!hasAcknowledgedRisk && !isLendPositionType(positionType) && isHfLow())

    // SUB_COMPONENT: Trigger button to open the dialog
    const triggerButton = (
        <Button
            onClick={() => handleOpenChange(true)}
            disabled={disabled}
            variant="primary"
            className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
        >
            <span className="uppercase leading-[0]">
                {isLendPositionType(positionType)
                    ? 'Deposit'
                    : 'Withdraw'}
            </span>
            <ArrowRightIcon
                width={16}
                height={16}
                className="stroke-white group-[:disabled]:opacity-50"
            />
        </Button>
    )

    // SUB_COMPONENT: Close button to close the dialog
    const closeContentButton = !isTxInProgress ? (
        <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="h-6 w-6 flex items-center justify-center absolute right-6 top-[1.6rem] rounded-full opacity-70 bg-white ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0"
        >
            <X strokeWidth={2.5} className="h-4 w-4 text-black" />
            <span className="sr-only">Close</span>
        </Button>
    ) : null

    // SUB_COMPONENT: Tx in progress - Loading state UI
    const txInProgressLoadingState = isTxInProgress ? (
        <div className="flex flex-col items-center justify-center gap-6 mt-6">
            <LoaderCircle
                className={`text-secondary-500 w-28 h-28 animate-spin rounded-full`}
                strokeWidth={2.5}
            />
            <BodyText
                level="body1"
                weight="normal"
                className="text-gray-800 text-center max-w-[400px]"
            >
                {getTxInProgressText({
                    amount,
                    tokenName: assetDetails?.asset?.token?.symbol,
                    txStatus: isLendPositionType(positionType)
                        ? depositTx
                        : withdrawTx,
                    positionType,
                    actionTitle: isLendPositionType(positionType)
                        ? isMorphoMarkets || isMorphoVault
                            ? 'supply'
                            : 'lend'
                        : 'borrow',
                })}
            </BodyText>
            {canDisplayExplorerLinkWhileLoading && (
                <div className="flex items-center justify-between w-full py-[16px] bg-gray-200 lg:bg-white rounded-5 px-[24px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="text-gray-600"
                    >
                        View on explorer
                    </BodyText>
                    <div className="flex items-center gap-[4px]">
                        <BodyText
                            level="body2"
                            weight="medium"
                            className="text-gray-800 flex items-center gap-[4px]"
                        >
                            <a
                                href={getExplorerLink(
                                    isLendPositionType(positionType)
                                        ? depositTx.hash
                                        : withdrawTx.hash,
                                    assetDetails?.chain_id ||
                                    assetDetails?.platform?.chain_id
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-secondary-500"
                            >
                                {getTruncatedTxHash(
                                    isLendPositionType(positionType)
                                        ? depositTx.hash
                                        : withdrawTx.hash
                                )}
                            </a>
                            <ArrowUpRightIcon
                                width={16}
                                height={16}
                                className="stroke-secondary-500"
                            />
                        </BodyText>
                    </div>
                </div>
            )}
        </div>
    ) : null

    // SUB_COMPONENT: Content header UI
    const contentHeader = (
        <>
            {isShowBlock({
                deposit: depositTx.status === 'approve' && !isDepositTxInProgress,
                withdraw: withdrawTx.status === 'withdraw' && !isWithdrawTxInProgress,
            }) && (
                    // <DialogTitle asChild>
                    <HeadingText
                        level="h4"
                        weight="medium"
                        className="text-gray-800 text-center capitalize"
                    >
                        Confirm {isLendPositionType(positionType)
                            ? 'Deposit'
                            : `Withdraw`}
                    </HeadingText>
                    // </DialogTitle>
                )}
            {/* Confirmation details UI */}
            {isShowBlock({
                deposit:
                    (depositTx.status === 'deposit' && !isDepositTxInProgress) ||
                    (depositTx.status === 'view' && !isDepositTxInProgress),
                withdraw:
                    // (borrowTx.status === 'borrow' && !isBorrowTxInProgress) ||
                    withdrawTx.status === 'view' && !isWithdrawTxInProgress,
            }) && (
                    <div className="flex flex-col items-center justify-center gap-[6px]">
                        <ImageWithDefault
                            src={assetDetails?.asset?.token?.logo}
                            alt={assetDetails?.asset?.token?.symbol}
                            width={40}
                            height={40}
                            className="rounded-full max-w-[40px] max-h-[40px]"
                        />
                        <HeadingText
                            level="h3"
                            weight="medium"
                            className="text-gray-800"
                        >
                            {amount} {assetDetails?.asset?.token?.symbol}
                        </HeadingText>
                        {isShowBlock({
                            deposit: depositTx.status === 'view',
                            withdraw: withdrawTx.status === 'view',
                        }) && (
                                <Badge
                                    variant={isTxFailed ? 'destructive' : 'green'}
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isLendPositionType(positionType) &&
                                        depositTx.status === 'view'
                                        ? isMorphoMarkets
                                            ? 'Add Collateral'
                                            : isMorphoVault
                                                ? 'Supply to vault'
                                                : 'Lend'
                                        : 'Borrow'}{' '}
                                    {isTxFailed ? 'Failed' : 'Successful'}
                                    {!isTxFailed && (
                                        <CircleCheckIcon
                                            width={16}
                                            height={16}
                                            className="stroke-[#00AD31]"
                                        />
                                    )}
                                    {isTxFailed && (
                                        <CircleXIcon
                                            width={16}
                                            height={16}
                                            className="stroke-danger-500"
                                        />
                                    )}
                                </Badge>
                            )}
                        {isShowBlock({
                            deposit: depositTx.status === 'deposit' && !isDepositTxInProgress,
                            withdraw: false,
                        }) && (
                                <Badge
                                    variant="green"
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    Token approved
                                    <CircleCheckIcon
                                        width={16}
                                        height={16}
                                        className="stroke-[#00AD31]"
                                    />
                                </Badge>
                            )}
                    </div>
                )}
        </>
    )

    // SUB_COMPONENT: Content body UI
    const contentBody = (
        <>
            <div className="flex flex-col gap-[12px]">
                {/* Block 1 */}
                {isShowBlock({
                    deposit: depositTx.status === 'approve' && !isDepositTxInProgress,
                    withdraw:
                        withdrawTx.status === 'withdraw' && !isWithdrawTxInProgress,
                }) && (
                        <div className="flex items-center gap-[8px] px-[24px] py-[18.5px] bg-gray-200 lg:bg-white rounded-5 w-full">
                            <ImageWithDefault
                                src={assetDetails?.asset?.token?.logo}
                                alt={assetDetails?.asset?.token?.symbol}
                                width={24}
                                height={24}
                                className="rounded-full max-w-[24px] max-h-[24px]"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                                <HeadingText
                                    level="h3"
                                    weight="normal"
                                    className="text-gray-800"
                                >
                                    {Number(amount).toFixed(
                                        decimalPlacesCount(amount)
                                    )}
                                </HeadingText>
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    {handleInputUsdAmount(
                                        inputUsdAmount.toString()
                                    )}
                                </BodyText>
                            </div>
                        </div>
                    )}
                {/* Block 2 */}
                {isShowBlock({
                    deposit: depositTx.status === 'approve' && !isDepositTxInProgress,
                    withdraw: false,
                }) && (
                        <div
                            className={`flex items-center ${isLendPositionType(positionType) ? 'justify-end' : 'justify-between'} px-[24px] mb-[4px] gap-1`}
                        >
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                Bal:
                            </BodyText>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {handleSmallestValue(
                                    (Number(balance) - Number(amount)).toString()
                                )}{' '}
                                {assetDetails?.asset?.token?.symbol}
                            </BodyText>
                        </div>
                    )}
                {/* Block 3 */}
                <div className="flex flex-col items-center justify-between px-[24px] bg-gray-200 lg:bg-white rounded-5 divide-y divide-gray-300">
                    {isShowBlock({
                        deposit: !isDepositTxInProgress,
                        withdraw: !isWithdrawTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Net APY
                                </BodyText>
                                <Badge variant="green">
                                    {abbreviateNumber(
                                        isLendPositionType(positionType)
                                            ? Number(
                                                (assetDetails?.asset?.apy ||
                                                    assetDetails?.asset
                                                        ?.supply_apy ||
                                                    assetDetails?.supply_apy ||
                                                    assetDetails?.apy) ??
                                                0
                                            )
                                            : Number(
                                                (assetDetails?.asset
                                                    ?.variable_borrow_apy ||
                                                    assetDetails?.variable_borrow_apy) ??
                                                0
                                            )
                                    )}
                                    %
                                </Badge>
                            </div>
                        )}
                    {isShowBlock({
                        deposit: false,
                        withdraw:
                            withdrawTx.status === 'withdraw' &&
                            !isWithdrawTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    New limit
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText
                                        level="body2"
                                        weight="normal"
                                        className="text-gray-800"
                                    >
                                        {handleSmallestValue(
                                            (
                                                Number(maxBorrowAmount) -
                                                Number(amount)
                                            ).toString(),
                                            getMaxDecimalsToDisplay(
                                                assetDetails?.asset?.token
                                                    ?.symbol ||
                                                assetDetails?.token?.symbol
                                            )
                                        )}
                                    </BodyText>
                                    <ImageWithDefault
                                        src={assetDetails?.asset?.token?.logo}
                                        alt={assetDetails?.asset?.token?.symbol}
                                        width={16}
                                        height={16}
                                        className="rounded-full max-w-[16px] max-h-[16px]"
                                    />
                                </div>
                            </div>
                        )}
                    {isShowBlock({
                        deposit: false,
                        withdraw:
                            withdrawTx.status === 'withdraw' &&
                            !isWithdrawTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    Health factor
                                </BodyText>
                                <div className="flex flex-col items-end justify-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={`text-gray-800`}
                                        >
                                            {healthFactorValues.healthFactor.toFixed(
                                                2
                                            )}
                                        </BodyText>
                                        <ArrowRightIcon
                                            width={16}
                                            height={16}
                                            className="stroke-gray-800"
                                            strokeWidth={2.5}
                                        />
                                        <BodyText
                                            level="body2"
                                            weight="normal"
                                            className={getNewHfColor()}
                                        >
                                            {healthFactorValues.newHealthFactor.toFixed(
                                                2
                                            )}
                                        </BodyText>
                                    </div>
                                    <Label size="small" className="text-gray-600">
                                        Liquidation at &lt;1.0
                                    </Label>
                                </div>
                            </div>
                        )}
                    {isShowBlock({
                        deposit:
                            (depositTx.status === 'approve' ||
                                depositTx.status === 'view') &&
                            depositTx.hash.length > 0 &&
                            !isDepositTxInProgress,
                        withdraw:
                            withdrawTx.status === 'view' &&
                            withdrawTx.hash.length > 0 &&
                            !isWithdrawTxInProgress,
                    }) && (
                            <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText
                                    level="body2"
                                    weight="normal"
                                    className="text-gray-600"
                                >
                                    View on explorer
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText
                                        level="body2"
                                        weight="medium"
                                        className="text-gray-800 flex items-center gap-[4px]"
                                    >
                                        <a
                                            href={getExplorerLink(
                                                isLendPositionType(positionType)
                                                    ? depositTx.hash
                                                    : withdrawTx.hash,
                                                assetDetails?.chain_id ||
                                                assetDetails?.platform?.chain_id
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-secondary-500"
                                        >
                                            {getTruncatedTxHash(
                                                isLendPositionType(positionType)
                                                    ? depositTx.hash
                                                    : withdrawTx.hash
                                            )}
                                        </a>
                                        <ArrowUpRightIcon
                                            width={16}
                                            height={16}
                                            className="stroke-secondary-500"
                                        />
                                    </BodyText>
                                </div>
                            </div>
                        )}
                    {/* <div className="flex items-center justify-between w-full py-[16px]">
                                <BodyText level="body2" weight="normal" className="text-gray-600">
                                    View on explorer
                                </BodyText>
                                <div className="flex items-center gap-[4px]">
                                    <BodyText level="body2" weight="normal" className="text-gray-800">
                                        0
                                    </BodyText>
                                    <ImageWithDefault src={'/images/tokens/eth.webp'} alt={"Ethereum"} width={16} height={16} className='rounded-full max-w-[16px] max-h-[16px]' />
                                </div>
                            </div> */}
                </div>
                {isShowBlock({
                    deposit: false,
                    withdraw:
                        withdrawTx.status === 'withdraw' &&
                        !isWithdrawTxInProgress &&
                        isHfLow(),
                }) && (
                        <div className="flex flex-col items-center justify-center">
                            <CustomAlert description="Borrowing this amount is not advisable, as the heath factor is close to 1, posing a risk of liquidation." />
                            <div
                                className="flex items-center gap-2 w-fit my-5"
                                onClick={() =>
                                    setHasAcknowledgedRisk(!hasAcknowledgedRisk)
                                }
                            >
                                <Checkbox
                                    id="terms"
                                    checked={hasAcknowledgedRisk}
                                />
                                <Label
                                    size="medium"
                                    className="text-gray-800"
                                    id="terms"
                                >
                                    I acknowledge the risks involved.
                                </Label>
                            </div>
                        </div>
                    )}
                {/* Block 4 */}
                <div className={`${isTxInProgress ? 'invisible h-0' : ''}`}>
                    <ActionButton
                        disabled={disableActionButton}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        setActionType={setActionType}
                        actionType={positionType}
                    />
                </div>
            </div>
        </>
    )

    // Desktop UI
    if (isDesktop) {
        return (
            <Dialog open={open}>
                <DialogTrigger asChild>{triggerButton}</DialogTrigger>
                <DialogContent
                    aria-describedby={undefined}
                    className="pt-[25px]"
                    showCloseButton={false}
                >
                    {/* X Icon to close the dialog */}
                    {closeContentButton}
                    {/* Tx in progress - Loading state UI */}
                    {txInProgressLoadingState}
                    {/* Initial Confirmation UI */}
                    <DialogHeader>{contentHeader}</DialogHeader>

                    {contentBody}
                </DialogContent>
            </Dialog>
        )
    }

    // Mobile UI
    return (
        <Drawer open={open} dismissible={false}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="w-full p-5 pt-2 dismissible-false">
                {/* X Icon to close the drawer */}
                {closeContentButton}
                {/* Tx in progress - Loading state UI */}
                {txInProgressLoadingState}
                <DrawerHeader>{contentHeader}</DrawerHeader>
                {/* <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter> */}
                {contentBody}
            </DrawerContent>
        </Drawer>
    )
}

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}

function getExplorerLink(hash: string, chainId: ChainId) {
    return `${TX_EXPLORER_LINKS[chainId]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}

function getTxInProgressText({
    amount,
    tokenName,
    txStatus,
    positionType,
    actionTitle,
}: {
    amount: string
    tokenName: string
    txStatus: TDepositTx | TWithdrawTx
    positionType: TPositionType
    actionTitle: string
}) {
    const formattedText = `${amount} ${tokenName}`
    const isPending = txStatus.isPending
    const isConfirming = txStatus.isConfirming
    let textByStatus: any = {}

    if (isPending) {
        textByStatus = {
            approve: `Approve spending ${formattedText} from your wallet`,
            lend: `Approve transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            borrow: `Approve transaction for ${actionTitle}ing ${formattedText} from your wallet`,
        }
    } else if (isConfirming) {
        textByStatus = {
            approve: `Confirming transaction for spending ${formattedText} from your wallet`,
            lend: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            borrow: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
            view: `Confirming transaction for ${actionTitle}ing ${formattedText} from your wallet`,
        }
    }
    return textByStatus[txStatus.status]
}

export function handleSmallestValue(
    amount: string,
    maxDecimalsToDisplay: number = 2
) {
    const amountFormatted = hasExponent(amount)
        ? Math.abs(Number(amount)).toFixed(10)
        : amount.toString()
    return `${hasLowestDisplayValuePrefix(Number(amountFormatted), maxDecimalsToDisplay)} ${getLowestDisplayValue(Number(amountFormatted), maxDecimalsToDisplay)}`
}

function getMaxDecimalsToDisplay(tokenSymbol: string): number {
    return tokenSymbol?.toLowerCase().includes('btc') ||
        tokenSymbol?.toLowerCase().includes('eth')
        ? 4
        : 2
}
