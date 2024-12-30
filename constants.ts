import { customMetisNetwork } from './config'
import { ChainId } from './types/chain'
import { Period, PeriodDisplay } from './types/periodButtons'
import {
    PlatformDisplayValue,
    PlatformValue,
    PlatformWebsiteLink,
} from './types/platform'
import {
    mainnet,
    arbitrum,
    polygon,
    bsc,
    gnosis,
    base,
    optimism,
    avalanche,
    scroll,
    AppKitNetwork,
    etherlink,
} from '@reown/appkit/networks'

export type TPlatformWebsiteLinks = {
    aave: PlatformWebsiteLink.AAVE
    compound: PlatformWebsiteLink.COMPOUND
    fluid: PlatformWebsiteLink.FLUID
    morpho: PlatformWebsiteLink.MORPHO
    superlend: PlatformWebsiteLink.SUPERLEND
}

export type TChainNamesBasedOnAaveMarkets = {
    bsc: 'bnb'
}

export const PERIOD_LIST = [
    {
        label: PeriodDisplay.oneDay,
        value: Period.oneDay,
    },
    {
        label: PeriodDisplay.oneWeek,
        value: Period.oneWeek,
    },
    { label: PeriodDisplay.oneMonth, value: Period.oneMonth },
    //   { label: PeriodDisplay.threeMonth, value: Period.threeMonth },
    //   { label: PeriodDisplay.sixMonth, value: Period.sixMonth },
    { label: PeriodDisplay.oneYear, value: Period.oneYear },
]

export const PERIOD_DISPLAY_MAPPER: { [key in Period]: string } = {
    [Period.oneDay]: 'day',
    [Period.oneWeek]: 'week',
    [Period.oneMonth]: 'month',
    //   [Period.threeMonth]: "3 months",
    //   [Period.sixMonth]: "6 months",
    [Period.oneYear]: 'year',
}

export const HISTORY_CHART_SELECT_OPTIONS = [
    {
        label: 'Deposit Rate',
        value: 'depositRate',
    },
    {
        label: 'Deposit Rate with Reward',
        value: 'depositRateReward',
    },
    {
        label: 'LTV',
        value: 'ltv',
    },
    {
        label: 'Variable Borrow APR',
        value: 'variableBorrowRate',
    },
    {
        label: 'Variable Borrow APR with Reward',
        value: 'variableBorrowRateReward',
    },
    {
        label: 'Utilization Rate',
        value: 'utilizationRate',
    },
    {
        label: 'Liquidation Threshold',
        value: 'liquidationThreshold',
    },
    {
        label: 'Liquidation Penalty',
        value: 'liquidationPenalty',
    },
    {
        label: 'Reserve Factor',
        value: 'reserveFactor',
    },
]

export const STABLECOINS_NAMES_LIST = [
    'USDT',
    'sUSDe',
    'USDe',
    'GHO',
    'USDC',
    'DAI',
    'USDS',
    'sDAI',
    'PYUSD',
    'crvUSD',
    'LUSD',
    'USDP',
    'TUSD',
    'sUSD',
    'FDUSD',
    'USDC.e',
    'fUSDT',
    'm.USDT',
    'm.DAI',
    'm.USDC',
    'USDbC',
    'DAI.e',
]

export const platformWebsiteLinks: TPlatformWebsiteLinks = {
    aave: PlatformWebsiteLink.AAVE,
    compound: PlatformWebsiteLink.COMPOUND,
    fluid: PlatformWebsiteLink.FLUID,
    morpho: PlatformWebsiteLink.MORPHO,
    superlend: PlatformWebsiteLink.SUPERLEND,
}

export const SHEET_FORM_URL =
    'https://script.google.com/macros/s/AKfycbwdG0b3rOiiRL0UP0KwHSBZfwVYRyeDZrJfVKAAV7yoVPGglaRaIanX91S_yRIl0ZYw/exec'

export const chainNamesBasedOnAaveMarkets: TChainNamesBasedOnAaveMarkets = {
    bsc: 'bnb',
}

export const PLATFORM_OPTIONS = [
    {
        value: PlatformValue.AaveV3Arbitrum,
        label: PlatformDisplayValue.AaveV3Arbitrum,
    },
    {
        value: PlatformValue.AaveV3Avalanche,
        label: PlatformDisplayValue.AaveV3Avalanche,
    },
    { value: PlatformValue.AaveV3Bsc, label: PlatformDisplayValue.AaveV3Bsc },
    { value: PlatformValue.AaveV3Base, label: PlatformDisplayValue.AaveV3Base },
    {
        value: PlatformValue.AaveV3Ethereum,
        label: PlatformDisplayValue.AaveV3Ethereum,
    },
    // {
    //   value: PlatformValue.AaveV3Fantom,
    //   label: PlatformDisplayValue.AaveV3Fantom,
    // },
    {
        value: PlatformValue.AaveV3Gnosis,
        label: PlatformDisplayValue.AaveV3Gnosis,
    },
    {
        value: PlatformValue.AaveV3Metis,
        label: PlatformDisplayValue.AaveV3Metis,
    },
    {
        value: PlatformValue.AaveV3Optimism,
        label: PlatformDisplayValue.AaveV3Optimism,
    },
    {
        value: PlatformValue.AaveV3Polygon,
        label: PlatformDisplayValue.AaveV3Polygon,
    },
    {
        value: PlatformValue.AaveV3Scoll,
        label: PlatformDisplayValue.AaveV3Scoll,
    },
    {
        value: PlatformValue.CompoundV2Ethereum,
        label: PlatformDisplayValue.CompoundV2Ethereum,
    },
    // {
    //   value: PlatformValue.SparkEthereum,
    //   label: PlatformDisplayValue.SparkEthereum,
    // },
    // { value: PlatformValue.SparkGnosis, label: PlatformDisplayValue.SparkGnosis },
]

export const POOL_BASED_PROTOCOLS = ['aaveV3', 'compoundV2'] // Extracted values from the protocol_type field in the backend
export const PAIR_BASED_PROTOCOLS = ['morpho', 'fluid'] // Extracted values from the protocol_type field in the backend

export enum WarningMessages {
    hardcoded_oracle = 'Using a fixed oracle, limits accurate pricing.',
    low_liquidity = 'Low liquidity, may affect borrowing costs.',
    unrecognized_lender = 'Lender unknown, check for risks.',
    not_whitelisted = 'Asset not approved, use cautiously.',
    unrecognized_oracle = 'Oracle unverified, pricing may be inaccurate.',
    unrecognized_collateral_asset = 'Collateral unrecognized, review asset safety.',
    unrecognized_loan_asset = 'Loan asset unknown, check details.',
    incompatible_oracle_feeds = 'Oracle feeds conflict, may affect rates.',
    bad_debt_unrealized = 'Potential bad debt, monitor closely.',
    incorrect_loan_exchange_rate = 'Loan rate error, verify terms.',
    incorrect_collateral_exchange_rate = 'Collateral rate error, double-check values.',
    unrecognized_oracle_feed = 'Oracle feed unknown, pricing reliability in question.',
}

export const TOO_MANY_DECIMALS_VALIDATIONS_TEXT =
    'Decrease digits after decimal point'
export const CONFIRM_ACTION_IN_WALLET_TEXT = 'Confirm the action in your wallet'
export const CONFIRM_NETWORK_CHANGING =
    'Confirm the network changing in your wallet'
export const NETWORK_CHANGING_SUCCESS = 'Network successfully changed'
export const ACTION_CANCEL_TEXT =
    'Network was not changed because the action was not confirmed in your wallet'
export const SOMETHING_WENT_WRONG_MESSAGE = 'Something went wrong'
export const DATA_UNAVAILABLE_MESSAGE =
    'Information is temporarily unavailable. Please try again later.'
export const SUCCESS_MESSAGE = 'Success'
export const APPROVE_MESSAGE = 'Transaction was successful'
export const TRANSACTION_CANCEL_TEXT =
    'Transaction was canceled because the action was not confirmed in your wallet'

export const SOMETHING_WENT_WRONG_WITH_RELOAD_MESSAGE =
    'Something went wrong, please reload the page'

export const ERROR_TOAST_ICON_STYLES = {
    iconTheme: {
        primary: '#FFF',
        secondary: '#090A0A',
    },
}

export const POOL_AAVE_MAP: { [key in PlatformValue]: `0x${string}` } = {
    [PlatformValue.AaveV3Arbitrum]:
        '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    [PlatformValue.AaveV3Avalanche]:
        '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    [PlatformValue.AaveV3Bsc]: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
    [PlatformValue.AaveV3Base]: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    [PlatformValue.AaveV3Ethereum]:
        '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    // [PlatformValue.AaveV3Fantom]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    [PlatformValue.AaveV3Gnosis]: '0xb50201558B00496A145fE76f7424749556E326D8',
    [PlatformValue.AaveV3Metis]: '0x90df02551bB792286e8D4f13E0e357b4Bf1D6a57',
    [PlatformValue.AaveV3Optimism]:
        '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    [PlatformValue.AaveV3Polygon]: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    [PlatformValue.AaveV3Scoll]: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe',
    // [PlatformValue.SparkEthereum]: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    // [PlatformValue.SparkGnosis]: '0xb50201558B00496A145fE76f7424749556E326D8',
    [PlatformValue.CompoundV2Ethereum]: '0x', // not used
}

export const TX_EXPLORER_LINKS: { [key in PlatformValue]: string } = {
    [PlatformValue.AaveV3Arbitrum]: 'https://arbiscan.io',
    [PlatformValue.AaveV3Avalanche]: 'https://snowtrace.io',
    [PlatformValue.AaveV3Bsc]: 'https://bscscan.com',
    [PlatformValue.AaveV3Base]: 'https://basescan.org',
    [PlatformValue.AaveV3Ethereum]: 'https://etherscan.io',
    [PlatformValue.AaveV3Gnosis]: 'https://gnosisscan.io',
    [PlatformValue.AaveV3Metis]: 'https://metis.blockscout.com',
    [PlatformValue.AaveV3Optimism]: 'https://optimistic.etherscan.io',
    [PlatformValue.AaveV3Polygon]: 'https://polygonscan.com',
    [PlatformValue.AaveV3Scoll]: 'https://scrollscan.io',
    [PlatformValue.CompoundV2Ethereum]: 'https://etherscan.io',
}

export const APPROXIMATE_ESTIMATE_OF_RETURNS_TOOLTIP_CONTENT =
    'This is an approximate estimate of returns and not the actual returns as change in supply will affect the overall earnings with time'

export const MORPHO_ETHERSCAN_TUTORIAL_LINK =
    'https://docs.morpho.org/morpho/tutorials/etherscan-use/'

export const CHAIN_ID_MAPPER: { [key in ChainId]: AppKitNetwork } = {
    [ChainId.Polygon]: polygon,
    [ChainId.Arbitrum]: arbitrum,
    [ChainId.Base]: base,
    [ChainId.Ethereum]: mainnet,
    [ChainId.Avalanche]: avalanche,
    [ChainId.Bsc]: bsc,
    [ChainId.Gnosis]: gnosis,
    [ChainId.Optimism]: optimism,
    [ChainId.Scroll]: scroll,
    [ChainId.Metis]: customMetisNetwork,
    [ChainId.Etherlink]: etherlink,
}
