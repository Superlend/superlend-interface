import { ChangeEvent } from 'react'
import { Input } from '../ui/input'

interface ICustomNumberInputProps {
    amount: string
    setAmount: (value: string) => void
}

const CustomNumberInput = ({ amount, setAmount }: ICustomNumberInputProps) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9.]/g, '')

        value = value.replace(/(\..*?)\..*/g, '$1')

        if (value) {
            if (value.includes('.')) {
                const parts = value.split('.')
                parts[0] = parts[0] ? parseInt(parts[0], 10).toString() : '0'
                value = parts.join('.')
            } else {
                value = parseInt(value, 10).toString()
            }
        }

        setAmount(value)
    }

    return (
        <Input
            placeholder="0.00"
            id="numberInput"
            type="text"
            value={amount}
            onChange={handleChange}
            className="w-full focus:outline-none text-[24px] font-medium placeholder:text-gray-500 pl-0 truncate"
        />
    )
}

export default CustomNumberInput;