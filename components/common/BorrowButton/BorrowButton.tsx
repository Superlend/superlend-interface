import { useWriteContract, useWaitForTransactionReceipt, type BaseError } from 'wagmi'
// import { Action } from '../../../types/assetsTable'
// import { getActionName } from '@utils/getActionName'
// import CustomButton from '@components/ui/CustomButton'
import COMPOUND_ABI from '@/data/abi/compoundABI.json'
import AAVE_POOL_ABI from '@/data/abi/aavePoolABI.json'
import { useCallback, useEffect } from 'react'
// import { AddressType } from '../../../types/address'
// import { IAssetData } from '@interfaces/IAssetData'
import {
  CONFIRM_ACTION_IN_WALLET_TEXT,
  ERROR_TOAST_ICON_STYLES,
  POOL_AAVE_MAP,
  // POOL_AAVE_MAP,
  SOMETHING_WENT_WRONG_MESSAGE,
  SUCCESS_MESSAGE,
} from '../../../constants'
import { parseUnits } from 'ethers/lib/utils'
// import toast from 'react-hot-toast'
// import { getErrorText } from '@utils/getErrorText'
import { countCompoundDecimals } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PlatformType, PlatformValue } from '@/types/platform'
import { useActiveAccount } from 'thirdweb/react'
import CustomAlert from '@/components/alerts/CustomAlert'
import { TLendBorrowTxContext, useLendBorrowTxContext } from '@/context/lend-borrow-tx-provider'
import { ArrowRightIcon } from 'lucide-react'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface IBorrowButtonProps {
  disabled: boolean
  asset: any
  amount: string
  handleCloseModal: (isVisible: boolean) => void
}

const txBtnStatus: Record<string, string> = {
  pending: 'Borrowing...',
  confirming: 'Confirming...',
  success: 'View position',
  default: 'Borrow'
}

const BorrowButton = ({
  disabled,
  asset,
  amount,
  handleCloseModal,
}: IBorrowButtonProps) => {
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract()
  // const { address: walletAddress } = useAccount()
  // const { createToast } = useCreatePendingToast()
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address;
  const { borrowTx, setBorrowTx } = useLendBorrowTxContext() as TLendBorrowTxContext;

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  useEffect(() => {
    if (hash) {
      setBorrowTx({ status: "view", hash });
    }
  }, [hash]);


  const txBtnText = txBtnStatus[isConfirming ? 'confirming' : isConfirmed ? 'success' : isPending ? 'pending' : 'default']

  const borrowCompound = useCallback(
    async (cTokenAddress: string, amount: string) => {
      try {
        // handleCloseModal(false)
        // await toast.promise(
        //   writeContractAsync({
        //     address: cTokenAddress,
        //     abi: COMPOUND_ABI,
        //     functionName: 'borrow',
        //     args: [
        //       parseUnits(
        //         amount,
        //         countCompoundDecimals(asset.decimals, asset.underlyingDecimals)
        //       ),
        //     ],
        //   }),
        //   {
        //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
        //     success: SUCCESS_MESSAGE,
        //     error: (error: { message: string }) => {
        //       if (error && error.message) {
        //         return getErrorText(error)
        //       }
        //       return SOMETHING_WENT_WRONG_MESSAGE
        //     },
        //   },
        //   ERROR_TOAST_ICON_STYLES
        // )
        // toast.remove()

        writeContractAsync({
          address: cTokenAddress,
          abi: COMPOUND_ABI,
          functionName: 'borrow',
          args: [
            parseUnits(
              amount,
              // countCompoundDecimals(asset.decimals, asset.underlyingDecimals)
              countCompoundDecimals(asset.decimals, asset.decimals)
            ),
          ],
        })
      } catch (error) {
        // toast.remove()
        error
      }
    },
    [writeContractAsync, asset, handleCloseModal]
  )

  const borrowAave = useCallback(
    async (
      poolContractAddress: string,
      underlyingAssetAdress: string,
      amount: string,
      addressOfWallet: string
    ) => {
      try {
        // handleCloseModal(false)
        // await toast.promise(
        //   writeContractAsync({
        //     address: poolContractAddress,
        //     abi: AAVE_POOL_ABI,
        //     functionName: 'borrow',
        //     args: [
        //       underlyingAssetAdress,
        //       parseUnits(amount, asset.decimals),
        //       2,
        //       0,
        //       addressOfWallet,
        //     ],
        //   }),
        //   {
        //     loading: CONFIRM_ACTION_IN_WALLET_TEXT,
        //     success: SUCCESS_MESSAGE,
        //     error: (error: { message: string }) => {
        //       if (error && error.message) {
        //         return getErrorText(error)
        //       }
        //       return SOMETHING_WENT_WRONG_MESSAGE
        //     },
        //   },
        //   ERROR_TOAST_ICON_STYLES
        // )
        // toast.remove()

        // console.log(poolContractAddress);
        // console.log(underlyingAssetAdress);
        // console.log(amount);
        // console.log(asset.asset.token.decimals);
        // console.log(addressOfWallet);

        writeContractAsync({
          address: poolContractAddress,
          abi: AAVE_POOL_ABI,
          functionName: 'borrow',
          args: [
            underlyingAssetAdress,
            parseUnits(amount, asset.asset.token.decimals),
            2,
            0,
            addressOfWallet,
          ],
        })

      } catch (error) {
        // toast.remove()
        error
      }
    },
    [writeContractAsync, asset, handleCloseModal]
  )

  const onBorrow = async () => {
    // createToast()
    // console.log(asset);

    if (asset?.protocol_type === PlatformType.COMPOUND) {
      await borrowCompound(asset?.asset?.token?.address, amount)
      return
    }
    if (asset?.protocol_type === PlatformType.AAVE) {
      // console.log(POOL_AAVE_MAP[asset?.platform_name as PlatformValue]);
      // console.log(asset?.asset?.token?.address);
      // console.log(amount);
      // console.log(walletAddress);

      await borrowAave(
        POOL_AAVE_MAP[asset?.platform_name as PlatformValue],
        // asset?.core_contract,
        asset?.asset?.token?.address,
        amount,
        walletAddress as string
      )
      return
    }
  }
  return (
    <>
      {error && (
        <CustomAlert description={(error as BaseError).shortMessage || error.message} />
      )}
      <Button variant="primary"
        className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
        disabled={isPending || isConfirming || disabled}
        onClick={borrowTx.status === "borrow" ? onBorrow : () => handleCloseModal(false)}
      >
        {txBtnText}
        <ArrowRightIcon width={16} height={16} className='stroke-white group-[:disabled]:opacity-50' />
      </Button>
    </>
  )
}

export default BorrowButton
