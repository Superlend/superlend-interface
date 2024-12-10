import { useActiveAccount } from 'thirdweb/react';
import {
  ReservesDataHumanized,
  UiPoolDataProvider,
  UserReserveDataHumanized,
} from '@aave/contract-helpers';
import { useEthersMulticall } from '../useEthereumMulticall';
import { useState } from 'react';
import { formatReservesAndIncentives, formatUserSummaryAndIncentives } from '@aave/math-utils';
import { getAddress } from 'ethers/lib/utils';

export const useAaveV3Data = () => {
  const activeAccount = useActiveAccount();
  const { providers } = useEthersMulticall();
  const walletAddress = activeAccount?.address;

  const [reserveData, setReserveData] = useState<void | ReservesDataHumanized>();
  const [userData, setUserData] = useState<void | {
    userReserves: UserReserveDataHumanized[];
    userEmodeCategoryId: number;
  }>();

  const fetchReservesData = async (
    chainId: number,
    uiPoolDataProviderAddress: string,
    lendingPoolAddressProvider: string
  ) => {
    try {
      if (!walletAddress) return Promise.resolve();
      const uiPoolDataProviderInstance = new UiPoolDataProvider({
        uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
        provider: providers[chainId],
        chainId: chainId,
      });
      console.log(
        await uiPoolDataProviderInstance.getReservesData({
          lendingPoolAddressProvider: getAddress(lendingPoolAddressProvider),
        })
      );
      const result = await uiPoolDataProviderInstance.getReservesHumanized({
        lendingPoolAddressProvider: getAddress(lendingPoolAddressProvider),
      });
      setReserveData(result);
      console.log('reserve data ', reserveData);
      return result;
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUserData = async (
    chainId: number,
    uiPoolDataProviderAddress: string,
    lendingPoolAddressProvider: string
  ) => {
    try {
      if (!walletAddress) return Promise.resolve();

      const uiPoolDataProviderInstance = new UiPoolDataProvider({
        uiPoolDataProviderAddress: getAddress(uiPoolDataProviderAddress),
        provider: providers[chainId],
        chainId: chainId,
      });

      const result = await uiPoolDataProviderInstance.getUserReservesHumanized({
        lendingPoolAddressProvider: getAddress(lendingPoolAddressProvider),
        user: getAddress(walletAddress),
      });
      setUserData(result);
      console.log('user data ', userData);
      return result;
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAaveV3Data = async (
    chainId: number,
    uiPoolDataProviderAddress: string,
    lendingPoolAddressProvider: string
  ) => {
    fetchReservesData(chainId, uiPoolDataProviderAddress, lendingPoolAddressProvider)
      .then((r) => console.log(r))
      .catch((e) => console.error(e));
    fetchUserData(chainId, uiPoolDataProviderAddress, lendingPoolAddressProvider)
      .then((r) => console.log(r))
      .catch((e) => console.error(e));
  };

  const getMaxBorrowAmount = (token: string) => {
    if (!reserveData || !userData) return;
    const reserve = reserveData.reservesData.find(
      (r) => r.underlyingAsset.toLowerCase() === token.toLowerCase()
    );
    const baseCurrencyData = reserveData.baseCurrencyData;
    const userReserve = userData.userReserves.find(
      (r) => r.underlyingAsset === token.toLowerCase()
    );
    if (!reserve || !userReserve) return;

    const currentTimestamp = Date.now();
    ///

    const formattedPoolReserves = formatReservesAndIncentives({
      reserves: reserveData.reservesData,
      currentTimestamp,
      marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      reserveIncentives: [],
    }).map((r) => ({
      ...r,
      isEmodeEnabled: (r as any)?.eModeCategoryId !== 0,
      isWrappedBaseAsset: false,
    }));

    ///

    const user = formatUserSummaryAndIncentives({
      currentTimestamp: Date.now(),
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
      userReserves: userData.userReserves,
      formattedReserves: formattedPoolReserves,
      userEmodeCategoryId: userData.userEmodeCategoryId,
      reserveIncentives: [],
      userIncentives: [],
    });

    console.log('user ', user);
  };

  const getMaxSupplyAmount = async (token: string) => {};

  return {
    reserveData,
    userData,
    fetchAaveV3Data,
    getMaxBorrowAmount,
  };
};
