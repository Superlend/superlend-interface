import type { Config } from 'tailwindcss'

const {
    default: flattenColorPalette,
} = require('tailwindcss/lib/util/flattenColorPalette')

const config = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: '',
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        fontFamily: {
            sans: ['"Basier Circle"', 'system-ui', 'sans-serif'],
        },
        extend: {
            screens: {
                xs: '375px',
                '2xl': '1400px',
            },
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                gray: {
                    '100': 'hsl(var(--background))',
                    '200': 'hsl(var(--elevate-01))',
                    '300': 'hsl(var(--elevate-02))',
                    '400': 'hsl(var(--foreground-disabled))',
                    '500': 'hsl(var(--foreground-gray))',
                    '600': 'hsl(var(--foreground-subtle))',
                    '700': 'hsl(var(--foreground-muted))',
                    '800': 'hsl(var(--foreground))',
                    DEFAULT: 'hsl(var(--foreground-gray))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary-01))',
                    foreground: 'hsl(var(--primary-foreground))',
                    gradientStart: 'hsl(var(--primary-gradient-start))',
                    gradientEnd: 'hsl(var(--primary-gradient-end))',
                    gradientEndHover: 'hsl(var(--primary-gradient-end-hover))',
                    gradientEndActive:
                        'hsl(var(--primary-gradient-end-active))',
                },
                secondary: {
                    '100': 'hsl(var(--secondary-03))',
                    '300': 'hsl(var(--secondary-02))',
                    '500': 'hsl(var(--secondary-01))',
                    DEFAULT: 'hsl(var(--secondary-01))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                tertiary: {
                    black: 'hsl(var(--tertiary-black))',
                    navy: 'hsl(var(--tertiary-navy))',
                    blue: 'hsl(var(--tertiary-blue))',
                    green: 'hsl(var(--tertiary-green))',
                    charcoal: 'hsl(var(--tertiary-charcoal))',
                    lightblue: 'hsl(var(--tertiary-lightblue))',
                    lightgreen: 'hsl(var(--tertiary-lightgreen))',
                    yellow: 'hsl(var(--tertiary-yellow))',
                    pink: 'hsl(var(--tertiary-pink))',
                    cream: 'hsl(var(--tertiary-cream))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive-background))',
                    foreground: 'hsl(var(--destructive-foreground))',
                    border: 'hsl(var(--destructive-border))',
                    background: 'hsl(var(--destructive-background))',
                },
                danger: {
                    500: '#FF0000',
                },
                success: {
                    DEFAULT: 'hsl(var(--success-background))',
                    foreground: 'hsl(var(--success-foreground))',
                    500: '#0EA739',
                },
                warning: {
                    500: '#D19900',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    cream: 'hsl(var(--accent-cream))',
                    lightGreen: 'hsl(var(--accent-light-green))',
                    lightBlue: 'hsl(var(--accent-light-blue))',
                    darkBlue: 'hsl(var(--accent-dark-blue))',
                    darkGreen: 'hsl(var(--accent-dark-green))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                    blue: 'hsl(var(--chart-blue))',
                    purple: 'hsl(var(--chart-purple))',
                    green: 'hsl(var(--chart-green))',
                    orange: 'hsl(var(--chart-orange))',
                    yellow: 'hsl(var(--chart-yellow))',
                    aave: 'hsl(var(--chart-aave))',
                    compound: 'hsl(var(--chart-compound))',
                    fluidex: 'hsl(var(--chart-fluid))',
                },
            },
            borderRadius: {
                '1': 'var(--radius)', // 2px
                '2': 'calc(var(--radius) + 0.125rem)', // 4px
                '3': 'calc(var(--radius) + 0.375rem)', // 8px
                '4': 'calc(var(--radius) + 0.625rem)', // 12px
                '5': 'calc(var(--radius) + 0.875rem)', // 16px
                '6': 'calc(var(--radius) + 1.125rem)', // 20px
                '7': 'calc(var(--radius) + 1.375rem)', // 24px
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0',
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                    to: {
                        height: '0',
                    },
                },
                scroll: {
                    to: {
                        transform: 'translate(calc(-50% - 0.5rem))',
                    },
                },
                pulse: {
                    '0%, 100%': {
                        boxShadow: '0 0 0 0 var(--pulse-color)',
                    },
                    '50%': {
                        boxShadow: '0 0 0 8px var(--pulse-color)',
                    },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%) skewX(-20deg)' },
                    '100%': { transform: 'translateX(200%) skewX(-20deg)' },
                },
                rain: {
                    '0%': {
                        transform: 'translate3d(0, -20px, 0) rotate(0deg)',
                        opacity: '1'
                    },
                    '50%': {
                        opacity: '1'
                    },
                    '100%': {
                        transform: 'translate3d(30px, 120vh, 0) rotate(60deg)',
                        opacity: '1'
                    }
                },
                fall: {
                    '0%': {
                        transform: 'translate3d(0, -100px, 0)',
                        opacity: '0'
                    },
                    '10%': {
                        transform: 'translate3d(0, 0, 0)',
                        opacity: '1'
                    },
                    '90%': {
                        transform: 'translate3d(0, 100vh, 0)',
                        opacity: '1'
                    },
                    '100%': {
                        transform: 'translate3d(0, 120vh, 0)',
                        opacity: '0'
                    }
                },
                spin: {
                    '0%': {
                        transform: 'rotate(0deg)'
                    },
                    '100%': {
                        transform: 'rotate(360deg)'
                    }
                },
                shine: {
                    '0%': {
                        transform: 'translateX(-100%) skewX(0deg)',
                        backgroundSize: '200% 200%'
                    },
                    '50%': {
                        transform: 'translateX(100%) skewX(60deg)',
                        backgroundSize: '200% 200%'
                    },
                    '100%': {
                        transform: 'translateX(150%) skewX(0deg)',
                        backgroundSize: '200% 200%'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                scroll: 'scroll var(--animation-duration, 30s) var(--animation-direction, forwards) linear infinite',
                pulse: 'pulse var(--duration) ease-out infinite',
                shimmer: 'shimmer 1.5s infinite',
                'rain': 'rain 3s linear infinite',
                'fall': 'fall 5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'spin': 'spin 2s linear infinite',
                shine: 'shine 2s infinite ease-in-out',
            },
            transitionDuration: {
                '400': '400ms',
            },
            transitionTimingFunction: {
                'banner': 'cubic-bezier(0.32, 0.72, 0, 1)',
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
        addVariablesForColors,
        function({ addVariant }: any) {
            addVariant('banner-visible', '.banner-visible &')
        }
    ],
} satisfies Config

function addVariablesForColors({ addBase, theme }: any) {
    let allColors = flattenColorPalette(theme('colors'))
    let newVars = Object.fromEntries(
        Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
    )

    addBase({
        ':root': newVars,
    })
}

export default config
