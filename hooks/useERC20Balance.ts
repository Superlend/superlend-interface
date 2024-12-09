import { useEffect, useState } from "react";
import useGetTokensData from "./useGetTokensData";
import { TToken } from "../types";
import { useEthersMulticall } from "./useEthereumMulticall";
import { ContractCallContext, ContractCallResults } from "ethereum-multicall";
import ERC20ABI from "../data/abi/erc20ABI.json";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { useAssetsData } from "@/context/data-provider";

export const useERC20Balance = (address: string) => {
  const { allTokensData, allChainsData } = useAssetsData();
  const { ethMulticall } = useEthersMulticall();
  const tokenList = allTokensData as unknown as Record<number, TToken[]>;
  const chainList: string[] = allChainsData.map((chain) =>
    chain.chain_id.toString()
  );
  const [data, setData] = useState<
    Record<
      number,
      Record<string, { balanceRaw: string; balanceFormatted: number }>
    >
  >({});
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [isError, setIsError] = useState<Boolean>(false);

  const getERC20Balance = async (address: string) => {
    try {
      // if (isLoading) return;

      setIsError(false);
      setIsLoading(true);

      const chainLevelRequest: Promise<ContractCallResults[]>[] = [];
      for (const key of Object.keys(tokenList)) {
        if (!key) continue;
        const calls: ContractCallContext[][] = [[]];
        let currentIdx = 0;
        for (const token of tokenList[Number(key)]) {
          if (calls[currentIdx].length > 20) {
            calls.push([]);
            currentIdx++;
          }

          calls[currentIdx].push({
            reference: `${token.address.toLowerCase()}-${key}`,
            contractAddress: token.address,
            abi: ERC20ABI,
            calls: [
              {
                reference: "balance",
                methodName: "balanceOf",
                methodParameters: [address],
              },
            ],
          });
        }

        const requests: Promise<ContractCallResults>[] = [];
        for (const calldata of calls) {
          requests.push(ethMulticall(calldata, Number(key)));
        }
        chainLevelRequest.push(Promise.all(requests));
      }

      const multichainResults = await Promise.all(chainLevelRequest);
      const result: Record<
        number,
        Record<string, { balanceRaw: string; balanceFormatted: number }>
      > = {};
      for (const singlechainResult of multichainResults) {
        for (const tokenResults of singlechainResult) {
          for (const key of Object.keys(tokenResults.results)) {
            const shards = key.split("-");
            const tokenAddress = shards[0];
            const chainId = Number(shards[1]);

            const tokenResult =
              tokenResults?.results[key]?.callsReturnContext[0];
            if (!tokenResult.success) continue;

            const balanceBN = BigNumber.from(tokenResult?.returnValues[0]);
            if (!result[chainId]) result[chainId] = {};
            const balanceRaw = balanceBN.toString();
            const balanceFormatted = 0;
            result[chainId][tokenAddress] = { balanceRaw, balanceFormatted };
          }
        }
      }

      for (const key of Object.keys(tokenList)) {
        const chainId = Number(key);
        for (const token of tokenList[chainId]) {
          const tokenResult = result[chainId][token.address.toLowerCase()];
          if (!tokenResult) continue;
          result[chainId][token.address.toLowerCase()].balanceFormatted =
            Number(formatUnits(tokenResult.balanceRaw, token.decimals));
        }
      }
      setData(result);

      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // console.log('address', address);
    // console.log('tokenList', tokenList);
    // console.log('chainList', chainList);
    // console.log("data", data);

    // console.log(!!address, !!tokenList, chainList.length > 0, !data);
    if (
      !!address &&
      !!tokenList &&
      chainList.length > 0 &&
      Object.keys(data).length === 0
    ) {
      getERC20Balance(address);
    }
  }, [address, tokenList, chainList]);

  return { data, isLoading, isError, getERC20Balance };
};