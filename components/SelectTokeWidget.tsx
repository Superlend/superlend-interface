import React from 'react'
import { BodyText, HeadingText } from './ui/typography'
import ImageWithBadge from './ImageWithBadge'
import { Badge } from './ui/badge'
import { abbreviateNumber } from '@/lib/utils'
import { ArrowRightIcon, ChevronDownIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import ImageWithDefault from './ImageWithDefault'

interface ISelectTokeWidgetProps {
    setOpenSelectTokenDialog: (open: boolean) => void
    selectedToken: any
    opportunitiesData: any
    positionType: 'lend' | 'borrow'
    setShowOpportunitiesTable: (show: boolean) => void
    showOpportunitiesTable: boolean
    isLoading: boolean
}

const SelectTokeWidget: React.FC<ISelectTokeWidgetProps> = (
    {
        setOpenSelectTokenDialog,
        selectedToken,
        opportunitiesData,
        positionType,
        setShowOpportunitiesTable,
        showOpportunitiesTable,
        isLoading,
    }: ISelectTokeWidgetProps) => {
    const isDisabled = !selectedToken || opportunitiesData.length === 0

    const handleOpenTokenSelectionDialog = () => {
        setOpenSelectTokenDialog(true)
    }

    const handleViewOpportunities = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setShowOpportunitiesTable(true)
    }

    const lendHelperText = 'Earn better returns on your assets choose token to see opportunities'
    const borrowHelperText = 'Get better borrow rates on your assets choose token to see opportunities'
    const helperText = positionType === 'lend' ? lendHelperText : borrowHelperText

    return (
        <form className="flex flex-col w-full min-w-full md:min-w-[350px] max-w-[450px] p-3 rounded-3xl bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)] shrink-0">
            <div className="flex flex-col w-full bg-white rounded-2xl max-md:max-w-full">
                <button
                    onClick={handleOpenTokenSelectionDialog}
                    type="button"
                    className="flex gap-10 justify-between items-center p-6 w-full bg-white rounded-2xl border border-gray-100 border-solid min-h-[80px] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] max-md:px-5 max-md:max-w-full hover:border-gray-400 focus:border-gray-400"
                >
                    {!selectedToken &&
                        <label
                            htmlFor="lendingToken"
                            className="self-stretch my-auto text-sm sm:text-md font-medium leading-none text-stone-500"
                        >
                            Select {positionType === 'lend' ? 'lending' : 'collateral & borrow'} token
                        </label>}
                    {selectedToken &&
                        <div className="flex gap-2 items-center">
                            {!!selectedToken.chain_logo && 
                            <ImageWithBadge
                                mainImg={selectedToken.logo}
                                badgeImg={selectedToken.chain_logo}
                                mainImgAlt={selectedToken.symbol}
                                badgeImgAlt={selectedToken.chain_id}
                                mainImgWidth="32"
                                badgeImgWidth="16"
                                mainImgHeight="32"
                                badgeImgHeight="16"
                            />}
                            {!selectedToken.chain_logo && 
                            <ImageWithDefault
                                src={selectedToken.logo}
                                alt={selectedToken.symbol}
                                width="32"
                                height="32"
                            />}
                            <HeadingText level="h4" weight="medium">
                                {selectedToken.symbol}
                            </HeadingText>
                        </div>}
                    <div className="flex gap-1 justify-center items-center self-stretch px-2 my-auto w-8 h-8 rounded-xl border border-gray-100 border-solid bg-neutral-100">
                        <ChevronDownIcon strokeWidth={2.5} className="w-8 h-8 text-stone-800" />
                    </div>
                </button>
                {!selectedToken &&
                    <div className="w-full flex items-center justify-center">
                        <BodyText level="body2" weight="normal" className="text-center text-stone-500 py-4 px-3 sm:w-[35ch]">
                            {helperText}
                        </BodyText>
                    </div>
                }
            </div>
            {selectedToken &&
                <div className="flex flex-wrap items-center justify-between gap-2 pt-6 pb-4 px-4">
                    <BodyText level="body2" weight="medium" className="text-gray-500">
                        Balance: {abbreviateNumber(selectedToken.amount)}
                    </BodyText>
                    {!isLoading &&
                        <Badge variant="blue" className="w-fit">
                            {opportunitiesData.length} {opportunitiesData.length === 1 ? 'Opportunity' : 'Opportunities'} found
                        </Badge>
                    }
                    {isLoading &&
                        <Skeleton className="w-24 h-5 rounded-2" />
                    }
                </div>
            }
            {!showOpportunitiesTable &&
                <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    disabled={isDisabled}
                    onClick={handleViewOpportunities}
                    className="group w-full mt-4 rounded-5 py-2.5 flex items-center gap-2"
                >
                    <span className="self-stretch my-auto group-disabled:opacity-[0.5]">
                        View Opportunities
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-white group-disabled:opacity-[0.5]" />
                </Button>}
        </form>
    )
}

export default SelectTokeWidget
