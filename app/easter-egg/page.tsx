/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import MainContainer from "@/components/MainContainer";
import { cn } from "@/lib/utils";
import EasterEggSolved from "@/components/EasterEggSolved";
import EasterEggImage from "./easter-egg-image";
import { Label } from "@/components/ui/typography";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

interface CursorPosition {
	x: number;
	y: number;
}

const EasterEgg = () => {
	const [showOverlay, setShowOverlay] = useState(false);
	const [isSolved, setSolved] = useState(false);
	const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ x: 0, y: 0 });
	const { address: walletAddress } = useAccount()
	const router = useRouter();
	const previousWalletAddress = useRef<string | undefined>(undefined);

	useEffect(() => {
		document.cookie = "accessEasterEgg=false;";
	}, []);

	useEffect(() => {
		if (
			previousWalletAddress.current !== undefined &&
			walletAddress !== previousWalletAddress.current
		) {
			router.push("/discover"); // Immediate client navigation
			window.location.replace("/discover"); // Perform full reload
		}

		previousWalletAddress.current = walletAddress;
	}, [walletAddress, router]);

	useEffect(() => {
		toast("We have placed an Easter Egg on the page.\n\nFind it to unlock the reward!", {
			duration: 10000,
		});

		setShowOverlay(true);
	}, []);

	useEffect(() => {
		if (!isSolved) {
			const hintTimeout = setTimeout(() => {
				toast("Hint: Hover on the page to see the Easter Egg!", {
					duration: 10000,
				});
			}, 30000);

			return () => clearTimeout(hintTimeout);
		}
	}, [isSolved]);

	useEffect(() => {
		if (showOverlay) {
			document.documentElement.style.cursor = "none";
			document.documentElement.style.overflow = "hidden";
		} else {
			document.documentElement.style.cursor = "auto";
			document.documentElement.style.overflow = "auto";
		}

		return () => {
			document.documentElement.style.cursor = "auto";
			document.documentElement.style.overflow = "auto";
		};
	}, [showOverlay]);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			setCursorPosition({ x: event.clientX, y: event.clientY });
		};
		const handleTouchMove = (event: TouchEvent) => {
			const touch = event.touches[0];
			if (touch) {
				setCursorPosition({ x: touch.clientX, y: touch.clientY });
			}
		};
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("touchmove", handleTouchMove);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("touchmove", handleTouchMove);
		};
	}, []);

	// After Details
	const afterDeatilsRef = useRef<HTMLDivElement>(null);
	const handleScroll = () => {
		if (afterDeatilsRef.current) {
			const elementPosition = afterDeatilsRef.current.getBoundingClientRect().top + window.scrollY;
			const deviceOffset = window.innerWidth < 768 ? 70 : 90;
			const offsetPosition = elementPosition - deviceOffset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	};

	return (
		<MainContainer>
			<div className="flex items-center justify-center relative">
				<div
					className={cn("fixed inset-0 z-50 pointer-events-none duration-500", {
						"bg-black": showOverlay,
					})}
					style={{
						maskImage: `radial-gradient(circle ${cursorPosition.x ? "80" : "0"}px at ${cursorPosition.x
							}px ${cursorPosition.y}px, transparent 50%, black 100%)`,
						WebkitMaskImage: `radial-gradient(circle ${cursorPosition.x ? "80" : "0"}px at ${cursorPosition.x
							}px ${cursorPosition.y}px, transparent 50%, black 100%)`,
						maskPosition: "0 0",
						WebkitMaskPosition: "0 0",
						maskRepeat: "no-repeat",
						WebkitMaskRepeat: "no-repeat",
						maskComposite: "exclude",
						WebkitMaskComposite: "destination-out",
					}}
				/>

				<EasterEggImage
					isSolved={isSolved}
					onClickEasterEgg={() => {
						showOverlay && setSolved(true);
						setShowOverlay(false);
					}}
				/>
			</div>

			<div className="pt-6">
				<Label size="large" weight="medium">
					{isSolved && (
						<div ref={afterDeatilsRef}>
							At Superlend, we believe in blending innovation with fun. Today, we&apos;re excited to invite you
							to join an adventure that will ignite your curiosity and immerse you in the dynamic world of
							decentralized finance (DeFi). Introducing the SuperHunt—a thrilling quest designed for
							explorers, problem solvers, and those eager to unlock hidden treasures! But here&apos;s the twist:
							it&apos;s not just about rewards. SuperHunt is more than just a simple reward mechanism—it&apos;s an
							experience that brings you closer to the Superlend community, lets you explore our ecosystem,
							and discover secrets that will make you part of our exclusive circle. What&apos;s in the Hunt?
							Hidden Easter Eggs: Scattered throughout the Superlend platform and beyond are Easter Eggs
							waiting to be discovered. Each egg holds a piece of a larger mystery. The more eggs you find,
							the more secrets you&apos;ll unlock. But the journey doesn&apos;t stop there—each discovery brings you
							closer to unveiling something much bigger and getting more rewards. How to Get Involved:
							Start Your Hunt: Dive into the Superlend platform, engage with our community, and explore the
							world of DeFi like never before. The Easter Eggs are hidden in plain sight—within our
							interface, our social media posts, and maybe even in conversations with the Superlend team.
							Keep your eyes open! Complete Challenges: Some Easter Eggs are unlocked by completing
							specific challenges. Whether it&apos;s interacting with the platform in new ways, solving riddles,
							or sharing your experiences on social media, these quests will test your skills and reward
							your efforts. Share Your Discoveries: The Superlend community is at the heart of this hunt.
							Share your findings, insights, and theories with fellow participants on social media. Tag
							Superlend and use the hashtag #SuperHunt to see what others have discovered and maybe pick up
							a few clues along the way. Unlock Tiers of Rewards: Every Easter Egg reveals something
							different—some might give you exclusive insights into upcoming features, early access to new
							tools, rewards, or even badges that signify your expertise. There&apos;s more to be discovered as
							you unlock higher levels, and for those who go the distance, a special surprise awaits. What
							Can You Expect? The Easter Egg Hunt is designed to be more than just a game. It&apos;s a way to:
							Deepen Your Knowledge: As you uncover each Easter Egg, you&apos;ll gain insights into DeFi and the
							inner workings of Superlend that few others have. Earn Exclusive Access: Some eggs may lead
							to access to private events, sneak peeks into upcoming products and features, or even direct
							interactions with the Superlend team. Build Your Reputation: Stand out in the Superlend
							community by collecting rare badges and earning a spot on our exclusive leaderboard. Why This
							Hunt is Special We&apos;ve designed this campaign to reward curiosity and engagement. We want to
							celebrate the pioneers in our community—the people who are excited about Superlend&apos;s vision
							and are ready to immerse themselves in the adventure. While there&apos;s talk about rewards, this
							hunt isn&apos;t about monetary gain alone. It&apos;s about discovering something much more valuable:
							knowledge, community, and belonging. Of course, there may be a surprise or two along the way
							for those who complete the journey, but the real value lies in what you&apos;ll learn and the
							relationships you&apos;ll build along the way. Ready to Begin? The Superlend Easter Egg Hunt is
							officially live! Head to the platform, check out our social media channels, and start hunting
							for clues. Who knows? You might just be the first to uncover all the secrets we&apos;ve hidden for
							you. Join us today in this exciting journey and let the hunt begin!
						</div>
					)}
				</Label>
			</div>

			<EasterEggSolved isSolved={isSolved} handleScroll={handleScroll} walletAddress={walletAddress || ''} />
		</MainContainer>
	);
};

export default EasterEgg;
