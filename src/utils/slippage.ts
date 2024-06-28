export const DEFAULT_SLIPPAGE_BPS = 500

export const subtractSlippage = (amount: bigint) => (amount * BigInt(10000 - DEFAULT_SLIPPAGE_BPS)) / BigInt(10000)
