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
import { AssetsDataContext } from '@/context/data-provider'
import useGetPlatformData from '@/hooks/useGetPlatformData'
import { usePositionManagementContext } from '@/context/position-management-provider'
import useGetPortfolioData from '@/hooks/useGetPortfolioData'
import { TPlatformAsset, TPositionType, TToken } from '@/types'
import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    CircleCheck,
    CircleCheckIcon,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useContext, useMemo, useState } from 'react'
import {
    useIsAutoConnecting,
    useActiveAccount,
    useSwitchActiveWalletChain,
} from 'thirdweb/react'
import {
    abbreviateNumber,
    capitalizeText,
    checkDecimalPlaces,
    convertScientificToNormal,
    isLowestValue,
} from '@/lib/utils'
import { getRiskFactor } from '@/lib/utils'
import { BodyText, HeadingText } from '@/components/ui/typography'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import CustomNumberInput from '@/components/inputs/CustomNumberInput'
import AAVE_POOL_ABI from '@/data/abi/aaveApproveABI.json'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { formatUnits } from 'ethers/lib/utils'
import { BigNumberish } from 'ethers'
// import { PlatformType, PlatformValue } from "@/types/platform";

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
    POOL_BASED_PROTOCOLS,
    TOO_MANY_DECIMALS_VALIDATIONS_TEXT,
    TX_EXPLORER_LINKS,
} from '@/constants'
import ActionButton from '@/components/common/ActionButton'
import { defineChain, getContract } from 'thirdweb'
import { useReadContract as useReadContractThirdweb } from 'thirdweb/react'
import { client } from '../client'
import { useWalletBalance } from 'thirdweb/react'
import { config } from '@/config'
import {
    TLendBorrowTxContext,
    useLendBorrowTxContext,
} from '@/context/lend-borrow-tx-provider'
import { PlatformValue } from '@/types/platform'

export default function LendAndBorrowAssets() {
    const [positionType, setPositionType] = useState<TPositionType>('lend')
    const [selectedTokenDetails, setSelectedTokenDetails] = useState<any>(null)
    const { allTokensData, allChainsData } = useContext(AssetsDataContext)
    const [amount, setAmount] = useState('')
    // const [balance, setBalance] = useState(0)
    const searchParams = useSearchParams()
    const tokenAddress = searchParams.get('token') || ''
    const chain_id = searchParams.get('chain_id') || 1
    const protocol_identifier = searchParams.get('protocol_identifier') || ''
    const activeAccount = useActiveAccount()
    const walletAddress = activeAccount?.address
    const isAutoConnecting = useIsAutoConnecting()
    const switchChain = useSwitchActiveWalletChain()

    const {
        data: portfolioData,
        isLoading: isLoadingPortfolioData,
        isError: isErrorPortfolioData,
    } = useGetPortfolioData({
        user_address: walletAddress as `0x${string}`,
        platform_id: [protocol_identifier],
        chain_id: [String(chain_id)],
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

    const isLoading = isLoadingPortfolioData || isLoadingPlatformData

    const customChain = defineChain(Number(chain_id))

    // const contract = getContract({
    //     client,
    //     address: platformData?.platform?.core_contract,
    //     chain: customChain,
    // });

    useEffect(() => {
        if (!!walletAddress) {
            switchChain(customChain)
        }
    }, [walletAddress, isAutoConnecting])

    // const { data, isLoading: isLoadingBalance, isError: isErrorBalance } = useWalletBalance({
    //     chain: customChain,
    //     address: walletAddress,
    //     tokenAddress: tokenAddress,
    //     client,
    // });
    // console.log("balance", data, data?.displayValue, data?.symbol);

    // Filter user positions
    const [selectedPlatformDetails] = portfolioData?.platforms.filter(
        (platform) =>
            platform?.protocol_identifier?.toLowerCase() ===
            (platformData?.platform as any)?.protocol_identifier?.toLowerCase()
    )
    // Filter lend and borrow positions
    const lendPositions = selectedPlatformDetails?.positions?.filter(
        (position) => position.type === 'lend'
    )
    const borrowPositions = selectedPlatformDetails?.positions?.filter(
        (position) => position.type === 'borrow'
    )
    // Check if there are multiple tokens
    // const hasMultipleTokens = isLendPositionType(positionType) ? lendPositions?.length > 1 : borrowPositions?.length > 1;
    const hasPosition = !!selectedPlatformDetails?.positions?.find(
        (position) => position?.token?.address === tokenAddress
    )

    const getAssetDetailsFromPortfolio = (tokenAddress: string) => {
        return {
            ...selectedPlatformDetails,
            positions: null,
            asset: {
                ...selectedPlatformDetails?.positions?.find(
                    (position) => position?.token?.address === tokenAddress
                ),
            },
        }
    }

    const getAssetDetails = (tokenAddress: string) => {
        if (!!selectedPlatformDetails && hasPosition) {
            return getAssetDetailsFromPortfolio(tokenAddress)
        }
        return {
            asset: {
                ...platformData?.assets?.find(
                    (platform: TPlatformAsset) =>
                        platform?.token?.address === tokenAddress
                ),
                amount: null,
            },
            ...platformData?.platform,
        }
    }

    const assetDetails = getAssetDetails(tokenAddress)

    // Get balance of token
    const result: any = useReadContract({
        abi: AAVE_POOL_ABI,
        address: tokenAddress,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
        account: walletAddress as `0x${string}`,
    })

    // Get balance of wallet
    // const resultData = useBalance({ address: walletAddress as `0x${string}` })

    // Calculate balance
    const balance = useMemo(() => {
        if (assetDetails && result?.data) {
            const countedDecimals = assetDetails?.asset.token?.decimals
            // assetDetails.platform.platform_name === PlatformValue.CompoundV2Ethereum
            //     ? assetDetails?.underlyingDecimals
            //     : assetDetails?.token?.decimals
            return formatUnits(result.data as BigNumberish, countedDecimals)
        }
        // if (assetDetails && resultData.data) {
        //     return formatUnits(
        //         resultData.data.value as BigNumberish,
        //         resultData.data.decimals
        //     )
        // }
        return '0'
    }, [result?.data])

    // useEffect(() => {
    //     if (allTokensData && allChainsData && walletAddress) {
    //         getTokenBalances({
    //             userAddress: walletAddress as `0x${string}`,
    //             contractAddress: platformData?.platform?.core_contract,
    //             chains: allChainsData.map((chain) => chain.chain_id),
    //             tokens: allTokensData
    //         })
    //             .then((data) => {
    //                 // setBalance(Number(balance))
    //                 console.log(data);

    //             })
    //             .catch((e: Error) => console.error(e))
    //     }
    // }, [
    //     allTokensData,
    //     allChainsData,
    //     walletAddress
    // ])

    const toManyDecimals = useMemo(() => {
        if (assetDetails) {
            return checkDecimalPlaces(
                amount,
                assetDetails?.asset?.token?.decimals ?? 0
            )
        }
        return false
    }, [assetDetails, amount])

    const disabledButton: boolean = useMemo(
        () =>
            Number(amount) > Number(balance) ||
            // assetDetails?.isFrozen ||
            Number(amount) <= 0 ||
            toManyDecimals,
        [amount, balance, toManyDecimals]
    )

    // Loading skeleton
    if (isLoading) {
        return <LoadingSectionSkeleton className="h-[300px] w-full" />
    }

    // Check if platform is aaveV3 or compoundV2, else return null
    if (!POOL_BASED_PROTOCOLS.includes(platformData?.platform?.protocol_type)) {
        return null
    }

    // Render component
    return (
        <section className="lend-and-borrow-section-wrapper flex flex-col gap-[12px]">
            <LendBorrowToggle
                type={positionType}
                handleToggle={(positionType: TPositionType) =>
                    setPositionType(positionType)
                }
            />
            <Card className="flex flex-col gap-[12px] p-[16px]">
                <div className="flex items-center justify-between px-[14px]">
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="capitalize text-gray-600"
                    >
                        {isLendPositionType(positionType)
                            ? 'lend collateral'
                            : `borrow ${assetDetails?.asset?.token?.symbol}`}
                    </BodyText>
                    {isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            Bal. {abbreviateNumber(Number(balance))}{' '}
                            <span className="inline-block truncate max-w-[70px]">
                                {assetDetails?.asset?.token?.symbol}
                            </span>
                        </BodyText>
                    )}
                    {!isLendPositionType(positionType) && (
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-600 flex items-center gap-[4px]"
                        >
                            limit - {abbreviateNumber(Number(balance))}
                        </BodyText>
                    )}
                </div>
                <CardContent className="p-0 bg-white rounded-5">
                    <div className="rounded-5 border border-gray-200 shadow-[0px_4px_16px_rgba(0,0,0,0.04)] py-[12px] px-[16px] flex items-center gap-[12px]">
                        {isLoading && (
                            <Skeleton className="shrink-0 w-[24px] h-[24px] rounded-full" />
                        )}
                        {!isLoading && (
                            <ImageWithDefault
                                src={assetDetails?.asset?.token?.logo || ''}
                                alt={assetDetails?.asset?.token?.symbol || ''}
                                className="shrink-0 w-[24px] h-[24px] rounded-full"
                                width={24}
                                height={24}
                            />
                        )}
                        {/* {
                            !isLoading && hasMultipleTokens && (
                                <SelectTokensDropdown
                                    key={positionType}
                                    options={isLendPositionType(positionType) ? lendPositions : borrowPositions}
                                    selectedItemDetails={selectedTokenDetails}
                                    setSelectedItemDetails={(token) => setSelectedTokenDetails(token)}
                                />
                            )
                        } */}
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="capitalize text-gray-500"
                        >
                            |
                        </BodyText>
                        <div className="flex flex-col gap-[4px]">
                            <CustomNumberInput
                                key={positionType}
                                amount={amount}
                                setAmount={(amount) => setAmount(amount)}
                            />
                            <span className="text-xs text-destructive-foreground">
                                {Number(amount) > Number(balance)
                                    ? 'You do not have enough balance'
                                    : toManyDecimals
                                      ? TOO_MANY_DECIMALS_VALIDATIONS_TEXT
                                      : null}
                            </span>
                        </div>
                        <Button
                            variant="link"
                            className="uppercase text-[14px] font-medium ml-auto"
                            onClick={() => setAmount(balance.toString())}
                            disabled={Number(amount) === Number(balance)}
                        >
                            max
                        </Button>
                    </div>
                    <BodyText
                        level="body2"
                        weight="normal"
                        className="mx-auto w-full text-gray-500 py-[16px] text-center max-w-[250px]"
                    >
                        {isLendPositionType(positionType)
                            ? 'Enter amount to proceed lending collateral for this position'
                            : 'Enter the amount you want to borrow from this position'}
                    </BodyText>
                </CardContent>
                <CardFooter className="p-0">
                    <ConfirmationDialog
                        disabled={disabledButton}
                        positionType={positionType}
                        assetDetails={assetDetails}
                        amount={amount}
                        balance={balance}
                        setAmount={setAmount}
                    />
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
    options: any[]
    selectedItemDetails: any
    setSelectedItemDetails: (token: any) => void
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
                    className="group flex items-center gap-1 text-gray-800"
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
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ConfirmationDialog({
    disabled,
    positionType,
    assetDetails,
    amount,
    setAmount,
    balance,
}: {
    disabled: boolean
    positionType: TPositionType
    assetDetails: any
    amount: string
    balance: string
    setAmount: (amount: string) => void
}) {
    // console.log("assetDetails", assetDetails)
    const { lendTx, setLendTx, borrowTx, setBorrowTx } =
        useLendBorrowTxContext() as TLendBorrowTxContext
    const [open, setOpen] = useState(false)

    function handleOpenChange(open: boolean) {
        setOpen(open)
        if (!open) {
            setAmount('')
            setLendTx({ status: 'approve', hash: '' })
            setBorrowTx({ status: 'borrow', hash: '' })
        }
    }

    function isShowBlock(status: { lend: boolean; borrow: boolean }) {
        return isLendPositionType(positionType) ? status.lend : status.borrow
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="primary"
                    className="group flex items-center gap-[4px] py-[13px] w-full rounded-5"
                >
                    <span className="uppercase leading-[0]">
                        {isLendPositionType(positionType)
                            ? 'Lend collateral'
                            : 'Review & Borrow'}
                    </span>
                    <ArrowRightIcon
                        width={16}
                        height={16}
                        className="stroke-white group-[:disabled]:opacity-50"
                    />
                </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="pt-[25px]">
                {/* Initial Confirmation*/}
                <DialogHeader>
                    {isShowBlock({
                        lend: lendTx.status === 'approve',
                        borrow: borrowTx.status === 'borrow',
                    }) && (
                        // <DialogTitle asChild>
                        <HeadingText
                            level="h4"
                            weight="medium"
                            className="text-gray-800 text-center"
                        >
                            {isLendPositionType(positionType)
                                ? 'Lend collateral'
                                : `Borrow ${assetDetails?.asset?.token?.symbol}`}
                        </HeadingText>
                        // </DialogTitle>
                    )}
                    {/* Confirmation details / Final Tx View */}
                    {isShowBlock({
                        lend:
                            lendTx.status === 'lend' ||
                            lendTx.status === 'view',
                        borrow: borrowTx.status === 'view',
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
                                lend: lendTx.status === 'view',
                                borrow: borrowTx.status === 'view',
                            }) && (
                                <Badge
                                    variant="green"
                                    className="capitalize flex items-center gap-[4px] font-medium text-[14px]"
                                >
                                    {isLendPositionType(positionType) &&
                                    lendTx.status === 'view'
                                        ? 'Lent'
                                        : 'Borrowed'}{' '}
                                    Successfully
                                    <CircleCheckIcon
                                        width={16}
                                        height={16}
                                        className="stroke-[#00AD31]"
                                    />
                                </Badge>
                            )}
                            {isShowBlock({
                                lend: lendTx.status === 'lend',
                                borrow: false,
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
                </DialogHeader>

                <div className="flex flex-col gap-[12px]">
                    {/* Block 1 */}
                    {isShowBlock({
                        lend: lendTx.status === 'approve',
                        borrow: borrowTx.status === 'borrow',
                    }) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-[24px] py-[18.5px] bg-white rounded-5">
                            <div className="flex items-center gap-[8px]">
                                <ImageWithDefault
                                    src={assetDetails?.asset?.token?.logo}
                                    alt={assetDetails?.asset?.token?.symbol}
                                    width={24}
                                    height={24}
                                    className="rounded-full max-w-[24px] max-h-[24px]"
                                />
                                <HeadingText
                                    level="h3"
                                    weight="normal"
                                    className="text-gray-800"
                                >
                                    {Number(amount)}
                                </HeadingText>
                            </div>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                ~$
                                {Number(amount) *
                                    Number(
                                        assetDetails?.asset?.token?.price_usd
                                    )}
                            </BodyText>
                        </div>
                    )}
                    {/* Block 2 */}
                    {isShowBlock({
                        lend: lendTx.status === 'approve',
                        borrow: borrowTx.status === 'borrow',
                    }) && (
                        <div className="flex items-center justify-between px-[24px] mb-[4px]">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {isLendPositionType(positionType)
                                    ? 'Bal.'
                                    : 'Remaining limit'}
                            </BodyText>
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {Number(balance) - Number(amount)}
                            </BodyText>
                        </div>
                    )}
                    {/* Block 3 */}
                    <div className="flex flex-col items-center justify-between px-[24px] bg-white rounded-5 divide-y divide-gray-300">
                        <div className="flex items-center justify-between w-full py-[16px]">
                            <BodyText
                                level="body2"
                                weight="normal"
                                className="text-gray-600"
                            >
                                {isLendPositionType(positionType)
                                    ? 'Lend'
                                    : 'Net'}{' '}
                                APY
                            </BodyText>
                            <Badge variant="green">
                                {abbreviateNumber(
                                    Number(assetDetails?.asset?.apy ?? 0)
                                )}
                                %
                            </Badge>
                        </div>
                        {!isLendPositionType(positionType) && (
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
                                        {abbreviateNumber(
                                            Number(balance) - Number(amount)
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
                            lend: lendTx.status === 'view',
                            borrow: borrowTx.status === 'view',
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
                                                    ? lendTx.hash
                                                    : borrowTx.hash,
                                                assetDetails?.platform_name
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-secondary-500"
                                        >
                                            {getTruncatedTxHash(
                                                isLendPositionType(positionType)
                                                    ? lendTx.hash
                                                    : borrowTx.hash
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
                    {/* Block 4 */}
                    <ActionButton
                        disabled={disabled}
                        handleCloseModal={handleOpenChange}
                        asset={assetDetails}
                        amount={amount}
                        positionType={positionType}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function isLendPositionType(positionType: TPositionType) {
    return positionType === 'lend'
}

function getExplorerLink(hash: string, platform_name: PlatformValue) {
    return `${TX_EXPLORER_LINKS[platform_name]}/tx/${hash}`
}

function getTruncatedTxHash(hash: string) {
    return `${hash.slice(0, 7)}...${hash.slice(-4)}`
}
