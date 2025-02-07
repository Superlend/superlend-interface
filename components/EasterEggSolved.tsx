'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import Confetti from 'react-confetti'
import useDimensions from '@/hooks/useDimensions'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LoaderCircle } from 'lucide-react'
import { BodyText } from './ui/typography'

type EasterEggSolvedProps = {
    isSolved: boolean
    handleScroll: () => void
    walletAddress: string
}

const endpoint = process.env.NEXT_PUBLIC_EASTER_EGG_ENDPOINT

const EasterEggSolved = ({
    isSolved,
    handleScroll,
    walletAddress,
}: EasterEggSolvedProps) => {
    const [isModalOpen, setModalOpen] = useState(false)
    const { width: screenWidth, height: screenHeight } = useDimensions()
    const [isUpdating, setIsUpdating] = useState(false)
    const [rank, setRank] = useState<number | null>(null)

    const referral =
        'I just uncovered a hidden Easter Egg on @SuperlendHQ 🥚💎\nJoin the hunt, unlock rewards, and experience the thrill of SuperHunt.\nTry to find it at app.superlend.xyz and start your adventure! 🚀'
    const redirectUrl =
        'https://x.com/intent/post?text=' + encodeURIComponent(referral)

    const fetchUserRank = useCallback(async () => {
        try {
            const response = await axios.get(
                `${endpoint}/api/rank?walletAddress=${walletAddress}`
            )
            setRank(response.data.rank)
        } catch (error) {
            toast.error('Unable to fetch your rank. Please try again later.')
            console.error('Error fetching rank:', error)
        }
    }, [walletAddress])

    const updateEasterEggStatus = useCallback(async () => {
        try {
            setIsUpdating(true)
            await fetchUserRank()
            await axios.post(`${endpoint}/api/update-entry`, { walletAddress })
            setIsUpdating(false)
        } catch (error) {
            toast.error('Something went wrong. Please try again later.')
            setIsUpdating(false)
        }
    }, [walletAddress, fetchUserRank])

    useEffect(() => {
        if (isSolved) {
            setModalOpen(isSolved)
            updateEasterEggStatus()
        }
    }, [isSolved, updateEasterEggStatus])

    const handleModalClose = () => {
        setModalOpen(false)
        setTimeout(() => {
            handleScroll()
        }, 300)
    }

    const getRankSuffix = (rank: number) => {
        if ([11, 12, 13].includes(rank % 100)) return 'th'
        switch (rank % 10) {
            case 1:
                return 'st'
            case 2:
                return 'nd'
            case 3:
                return 'rd'
            default:
                return 'th'
        }
    }

    return (
        <div>
            <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
                <DialogContent
                    className="sm:max-w-[425px] [&>button]:hidden duration-500"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    {isUpdating ? (
                        <LoaderCircle className="mx-auto animate-spin" />
                    ) : (
                        <>
                            <Confetti
                                className="absolute translate-x-[-50%] !left-[50%] translate-y-[-50%] !top-[50%]"
                                width={screenWidth}
                                height={screenHeight}
                                numberOfPieces={500}
                                tweenDuration={10000}
                                recycle={false}
                            />
                            <DialogHeader className="flex flex-col gap-y-2">
                                <DialogTitle>Congratulations 🎉</DialogTitle>
                                <DialogDescription className="text-gray-800">
                                    {rank !== null && (
                                        <div className="flex flex-col gap-y-2">
                                            <BodyText
                                                level="body2"
                                                className="text-inherit"
                                            >
                                                You&apos;re the{' '}
                                                <strong>
                                                    {rank}
                                                    {getRankSuffix(rank)}
                                                </strong>{' '}
                                                person to solve Easter Egg #1.
                                            </BodyText>
                                            <BodyText
                                                level="body2"
                                                className="text-inherit"
                                            >
                                                You&apos;re now successfully
                                                enrolled in SuperHunt.
                                            </BodyText>
                                        </div>
                                    )}
                                    {rank === null && (
                                        <BodyText
                                            level="body2"
                                            className="text-inherit"
                                        >
                                            You have solved Easter Egg #1.
                                            You&apos;re now successfully
                                            enrolled in SuperHunt.
                                        </BodyText>
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="primary"
                                    className="mx-auto text-sm w-[165px] h-10"
                                    onClick={() => {
                                        window.open(
                                            redirectUrl,
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                        handleModalClose()
                                    }}
                                >
                                    Share To Continue
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default EasterEggSolved
