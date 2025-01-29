import { TFontWeight } from '@/types/ui/typography'

export interface IHeadingTextProps {
    children: React.ReactNode
    level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    weight?: TFontWeight
    className?: string
}

export interface IBodyTextProps {
    children: React.ReactNode
    level: 'body1' | 'body2' | 'body3'
    weight?: TFontWeight
    className?: string
    as?: string
    [key: string]: any
}


export interface ILabelProps {
    children: React.ReactNode
    weight?: TFontWeight
    size?: 'small' | 'medium' | 'large'
    className?: string
    htmlFor?: string
    [key: string]: any
}
