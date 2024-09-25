import React from 'react'
import { Input } from '@/components/ui/input'
import SearchIcon from '../icons/search-icon'

type TProps = {
    className?: string
    value?: string
    onChange?: (event: any) => void
    props?: any[]
}

export default function SearchInput({ className, value, onChange, ...props }: TProps) {
    return (
        <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2' />
            <Input placeholder="Search" className='rounded-4 pl-10 border-none h-[38px]' value={value} onChange={onChange} {...props} />
        </div>
    )
}
