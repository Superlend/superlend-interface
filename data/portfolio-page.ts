export const POSITIONS_BREAKDOWN_DATA = [
  {
    label: 'collateral',
    data: '64,147',
    id: 1,
  },
  {
    label: 'borrowings',
    data: '64,147',
    id: 2,
  },
  {
    label: 'earnings',
    data: '64,147',
    id: 3,
  },
];

export const POSITIONS_AT_RISK_DATA = [
  {
    lendAmount: {
      tokenImage: '/images/tokens/btc.webp',
      amount: '4,278',
      change: '241.12',
    },
    borrowAmount: {
      tokenImage: '/images/tokens/usdc.webp',
      amount: '2,687',
    },
    positionOn: {
      platform: 'compound',
      chain: 'op',
      platformName: 'compound',
      platformImage: '/images/platforms/compound.webp',
      chainImage: '/images/chains/op.webp',
    },
    riskFactor: 'high',
  },
];
