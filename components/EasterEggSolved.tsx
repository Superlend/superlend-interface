"use client";

import { useCallback, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import Confetti from "react-confetti";
import useDimensions from "@/hooks/useDimensions";
import axios from "axios";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";

type EasterEggSolvedProps = {
	isSolved: boolean;
	handleScroll: () => void;
	walletAddress: string;
};

const endpoint = process.env.NEXT_PUBLIC_EASTER_EGG_ENDPOINT;

const EasterEggSolved = ({ isSolved, handleScroll, walletAddress }: EasterEggSolvedProps) => {
	const [isModalOpen, setModalOpen] = useState(false);
	const { width: screenWidth, height: screenHeight } = useDimensions();
	const [isUpdating, setIsUpdating] = useState(false);
	const [rank, setRank] = useState<number | null>(null);

	const referral = "Yeah! I have found a new Easter Egg at Superlend.xyz @SuperhuntHQ";
	const redirectUrl = "https://x.com/intent/post?text=" + encodeURIComponent(referral);

	const fetchUserRank = useCallback(async () => {
		try {
			const response = await axios.get(`${endpoint}/api/rank?walletAddress=${walletAddress}`);
			setRank(response.data.rank);
		} catch (error) {
			toast.error("Unable to fetch your rank. Please try again later.");
			console.error("Error fetching rank:", error);
		}
	}, [walletAddress]);

	const updateEasterEggStatus = useCallback(async () => {
		try {
			setIsUpdating(true);
			await fetchUserRank();
			await axios.post(`${endpoint}/api/update-entry`, { walletAddress });
			setIsUpdating(false);
		} catch (error) {
			toast.error("Something went wrong. Please try again later.");
			setIsUpdating(false);
		}
	}, [walletAddress, fetchUserRank]);

	useEffect(() => {
		if (isSolved) {
			setModalOpen(isSolved);
			updateEasterEggStatus();
		}
	}, [isSolved, updateEasterEggStatus]);

	const handleModalClose = () => {
		setModalOpen(false);
		setTimeout(() => {
			handleScroll();
		}, 300);
	};

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
							<DialogHeader>
								<DialogTitle>Congratulations 🎉</DialogTitle>
								<DialogDescription>
									{rank !== null
										? `You are ranked #${rank} in solving the quest!`
										: "You have been successfully enrolled."}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="primary"
									className="mx-auto text-sm w-[165px] h-10"
									onClick={() => {
										window.open(redirectUrl, "_blank", "noopener,noreferrer");
										handleModalClose();
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
	);
};

export default EasterEggSolved;
