// import CustomButton from '@components/ui/CustomButton'
import { useWriteContract } from 'wagmi';
import COMPOUND_ABI from '@/data/abi/compoundABI.json';
import { parseUnits } from 'ethers/lib/utils';
// import { AddressType } from '@/types/address'
// import { getActionName } from '@/lib/getActionName'
// import { Action } from '@/types/assetsTable'
// import toast from 'react-hot-toast'
import {
  CONFIRM_ACTION_IN_WALLET_TEXT,
  ERROR_TOAST_ICON_STYLES,
  SOMETHING_WENT_WRONG_MESSAGE,
  SUCCESS_MESSAGE,
} from '@/constants';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
// import { getErrorText } from '@utils/getErrorText'
// import { useCreatePendingToast } from '@hooks/useCreatePendingToast'

interface ISupplyETHCompoundButtonProps {
  disabled: boolean;
  cTokenAddress: string;
  amount: string;
  decimals: number;
  handleCloseModal: (isVisible: boolean) => void;
}

const SupplyETHCompoundButton = ({
  cTokenAddress,
  amount,
  decimals,
  disabled,
  handleCloseModal,
}: ISupplyETHCompoundButtonProps) => {
  const { writeContractAsync, isPending } = useWriteContract();
  // const { createToast } = useCreatePendingToast()

  const onSupply = async () => {
    try {
      // createToast()
      // handleCloseModal(false)
      // await toast.promise(
      //   writeContractAsync({
      //     address: cTokenAddress,
      //     abi: COMPOUND_ABI,
      //     functionName: 'mint',
      //     args: [],
      //     value: parseUnits(amount, decimals),
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

      // console.log("cTokenAddress", cTokenAddress);
      // console.log("amount", amount);
      // console.log("decimals", decimals);
      // console.log("parseUnits", parseUnits(amount, decimals));

      writeContractAsync({
        address: cTokenAddress as `0x${string}`,
        abi: COMPOUND_ABI,
        functionName: 'mint',
        args: [],
        value: parseUnits(amount, decimals) as unknown as bigint,
      });
    } catch (error) {
      // toast.remove()
      error;
    }
  };
  return (
    <Button
      variant="primary"
      className="group flex items-center gap-[4px] py-3 w-full rounded-5 uppercase"
      disabled={isPending || disabled}
      onClick={onSupply}
    >
      Lend
      <ArrowRightIcon
        width={16}
        height={16}
        className="stroke-white group-[:disabled]:opacity-50"
      />
    </Button>
  );
};

export default SupplyETHCompoundButton;
