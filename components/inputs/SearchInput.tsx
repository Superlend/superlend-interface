import React from 'react'
import { Input } from '@/components/ui/input'
import SearchIcon from '../icons/search-icon'
import { X } from 'lucide-react'

type TProps = {
    className?: string
    value?: string
    onChange?: (event: any) => void
    onClear?: (event: any) => void
    props?: any[]
}

export default function SearchInput({ className, value, onChange, onClear, ...props }: TProps) {
    const hasKeyword: boolean = !!value?.trim().length;
    return (
        <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2' />
            {hasKeyword &&
                <X onClick={onClear}
                    className='absolute right-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full bg-gray-300 hover:bg-gray-400 active:opacity-70 text-gray-600 p-[2px] cursor-pointer' />}
            <Input placeholder="Search" className='rounded-4 px-10 border-none h-[38px]' value={value} onChange={onChange} {...props} />
        </div>
    )
}
