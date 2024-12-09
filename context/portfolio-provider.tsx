"use client";

import useGetPortfolioData from "@/hooks/useGetPortfolioData";
import { TPortfolio } from "@/types/queries/portfolio";
import { createContext, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useERC20Balance } from "../hooks/useERC20Balance";

export type TPortfolioContext = {
  portfolioData: TPortfolio;
  isLoadingPortfolioData: boolean;
  isErrorPortfolioData: boolean;
};

const PortfolioDataInit = {
  platforms: [],
  total_borrowed: 0,
  total_supplied: 0,
};

export const PortfolioContext = createContext<TPortfolioContext>({
  portfolioData: PortfolioDataInit,
  isLoadingPortfolioData: false,
  isErrorPortfolioData: false,
});

export default function PortfolioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address;

  // get portfolio data for subset of chains (4 chains)
  const {
    data: portfolioData,
    isLoading: isLoadingPortfolioData,
    isError: isErrorPortfolioData,
  } = useGetPortfolioData({
    user_address: walletAddress as `0x${string}` | undefined,
  });

  const { getERC20Balance } = useERC20Balance(walletAddress);

  useEffect(() => {
    if (walletAddress) getERC20Balance(walletAddress);
  }, [walletAddress]);

  return (
    <PortfolioContext.Provider
      value={{
        portfolioData,
        isLoadingPortfolioData,
        isErrorPortfolioData,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}
