import React from 'react'
import { Input } from '@/components/ui/input'
import SearchIcon from '../icons/search-icon'

export default function SearchInput({ className }: { className?: string }) {
    return (
        <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2' />
            <Input placeholder="Search" className='rounded-4 pl-10 border-none h-[38px]' />
        </div>
    )
}
