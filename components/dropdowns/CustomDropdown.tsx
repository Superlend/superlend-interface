import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import ImageWithDefault from '@/components/ImageWithDefault';
import { BodyText } from '@/components/ui/typography';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

function CustomDropdown({
  options,
  selectedOption,
  setSelectedOption,
}: {
  options: any[];
  selectedOption: any;
  setSelectedOption: (option: any) => void;
}) {
  useEffect(() => {
    setSelectedOption(options[0]);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="md"
          variant="outline"
          className="group flex items-center gap-1 data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-800 rounded-2 focus-visible:ring-0"
        >
          <ImageWithDefault
            src={selectedOption?.token.logo}
            alt={selectedOption?.token.symbol}
            width={18}
            height={18}
            className="rounded-full max-w-[18px] max-h-[18px]"
          />
          <BodyText level="body2" weight="medium" className="text-gray-800">
            {selectedOption?.token.symbol}
          </BodyText>
          <ChevronDownIcon className="w-4 h-4 text-gray-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 rounded-[16px] border-none bg-white bg-opacity-40 backdrop-blur-md overflow-hidden">
        <DropdownMenuLabel className="text-gray-600 py-2 px-4">Select Option</DropdownMenuLabel>
        {options?.map((option: any) => (
          <DropdownMenuItem
            key={option?.token?.address}
            onClick={() => setSelectedOption(option)}
            className={cn(
              'flex items-center gap-2 hover:bg-gray-300 cursor-pointer py-2 px-4',
              selectedOption?.token?.address === option?.token?.address && 'bg-gray-400'
            )}
          >
            <ImageWithDefault
              src={option?.token?.logo || ''}
              alt={option?.token?.symbol || ''}
              width={20}
              height={20}
              className="rounded-full max-w-[20px] max-h-[20px]"
            />
            <BodyText level="body2" weight="medium" className="text-gray-800">
              {option?.token?.symbol || ''}
            </BodyText>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
