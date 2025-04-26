import React from 'react'
import { BodyText, HeadingText, Label } from './ui/typography'
import ImageWithBadge from './ImageWithBadge'
import { Badge } from './ui/badge'
import {
    abbreviateNumber,
    cn,
    formatAmountToDisplay,
    hasLowestDisplayValuePrefix,
} from '@/lib/utils'
import { ArrowRightIcon, ChevronDownIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import ImageWithDefault from './ImageWithDefault'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import { useAnalytics } from '@/context/amplitude-analytics-provider'

interface ISelectTokeWidgetProps {
    setOpenSelectTokenDialog: (open: boolean) => void
    selectedToken: any
    opportunitiesData: any
    positionType: 'lend' | 'borrow'
    setShowOpportunitiesTable: (show: boolean) => void
    isLoadingOpportunities: boolean
    tokenBalance: number
    isLoadingBalance: boolean
}

const SelectTokeWidget: React.FC<ISelectTokeWidgetProps> = ({
    setOpenSelectTokenDialog,
    selectedToken,
    opportunitiesData,
    positionType,
    setShowOpportunitiesTable,
    isLoadingOpportunities,
    tokenBalance,
    isLoadingBalance,
}: ISelectTokeWidgetProps) => {
    const isDisabled = !selectedToken || opportunitiesData.length === 0
    const { walletAddress, isWalletConnected, isConnectingWallet } =
        useWalletConnection()
    const { logEvent } = useAnalytics()

    const handleOpenTokenSelectionDialog = () => {
        logEvent('select_token_button_clicked', {
            action: positionType,
            wallet_address: walletAddress,
        })
        setOpenSelectTokenDialog(true)
    }

    const handleViewOpportunities = (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault()
        setShowOpportunitiesTable(true)
    }

    const lendHelperText =
        'Select an asset from your wallet to see earning opportunities.'
    const borrowHelperText =
        'Select an asset to view the best borrowing opportunities.'
    const helperText =
        positionType === 'lend' ? lendHelperText : borrowHelperText

    return (
        <div className="flex flex-col w-full min-w-full min-w-[350px] min-[1060px]:min-w-[400px] max-w-[450px] p-3 rounded-3xl bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)] shrink-0">
            <div className="flex flex-col w-full bg-white rounded-2xl max-md:max-w-full">
                <Button
                    variant="ghost"
                    onClick={handleOpenTokenSelectionDialog}
                    type="button"
                    className={cn(
                        'relative flex gap-10 justify-between items-center px-6 w-full bg-white rounded-2xl border border-gray-100 border-solid shadow-[0px_4px_16px_rgba(0,0,0,0.04)] max-md:px-5 max-md:max-w-full border-gray-200 hover:border-gray-400 focus:border-gray-400 rounded-5',
                        selectedToken ? 'py-2' : 'py-6'
                    )}
                >
                    {!selectedToken && (
                        <Label
                            htmlFor="lendingToken"
                            className="text-left max-[375px]:max-w-[18ch] max-[375px]:text-wrap my-auto text-sm sm:text-md font-medium leading-[1.2] text-gray-600"
                        >
                            Select{' '}
                            {positionType === 'lend' ? 'lending' : 'borrow'}{' '}
                            token
                        </Label>
                    )}
                    {selectedToken && (
                        <div className="flex gap-2 items-center max-w-full truncate min-h-[60px]">
                            {!!selectedToken.chain_logo && (
                                <ImageWithBadge
                                    mainImg={selectedToken.logo}
                                    badgeImg={selectedToken.chain_logo}
                                    mainImgAlt={selectedToken.symbol}
                                    badgeImgAlt={selectedToken.chain_id}
                                    mainImgWidth={32}
                                    badgeImgWidth={16}
                                    mainImgHeight={32}
                                    badgeImgHeight={16}
                                />
                            )}
                            {!selectedToken.chain_logo && (
                                <ImageWithDefault
                                    src={selectedToken.logo}
                                    alt={selectedToken.symbol}
                                    width={32}
                                    height={32}
                                />
                            )}
                            <HeadingText level="h4" weight="medium" className="truncate max-w-full" title={selectedToken.symbol}>
                                {selectedToken.symbol}
                            </HeadingText>
                        </div>
                    )}
                    <div className="flex gap-1 justify-center items-center self-stretch px-2 my-auto w-8 h-8 rounded-xl border border-gray-100 border-solid bg-neutral-100">
                        <ChevronDownIcon
                            strokeWidth={2.5}
                            className="w-8 h-8 text-stone-800"
                        />
                    </div>
                </Button>
                {!selectedToken && (
                    <div className="w-full flex items-center justify-center">
                        <BodyText
                            level="body2"
                            weight="normal"
                            className="text-center text-stone-500 py-4 px-3 sm:w-[35ch]"
                        >
                            {helperText}
                        </BodyText>
                    </div>
                )}
            </div>
            {selectedToken && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-6 pb-4 px-4">
                    <BodyText
                        level="body2"
                        weight="medium"
                        className="text-gray-500 flex items-center gap-1"
                    >
                        Balance:
                        {isLoadingBalance && (
                            <Skeleton className="w-6 h-4 rounded-2" />
                        )}
                        {!isLoadingBalance && isWalletConnected && (
                            <span>{` ${hasLowestDisplayValuePrefix(Number(tokenBalance))} ${formatAmountToDisplay(tokenBalance.toString())}`}</span>
                        )}
                        {!isLoadingBalance && !isWalletConnected && (
                            <span>--</span>
                        )}
                    </BodyText>

                    {!isLoadingOpportunities && (
                        <Badge variant="blue" className="w-fit">
                            {opportunitiesData.length}{' '}
                            {opportunitiesData.length === 1
                                ? 'Opportunity'
                                : 'Opportunities'}{' '}
                            found
                        </Badge>
                    )}
                    {isLoadingOpportunities && (
                        <Skeleton className="w-24 h-5 rounded-2" />
                    )}
                </div>
            )}
        </div>
    )
}

export default SelectTokeWidget
