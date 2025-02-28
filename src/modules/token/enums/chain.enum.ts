export enum ChainType {
    ARWEAVE = 'arweave',
    SOLANA = 'solana',
    // Add other chains as needed
}

export enum TokenTicker {
    AR = 'AR',
    SOL = 'SOL',
    USDC = 'USDC',
    USDT = 'USDT',
    // Add other tokens as needed
}

// Define valid combinations
export const VALID_CHAIN_TOKEN_COMBINATIONS = {
    [ChainType.ARWEAVE]: [TokenTicker.AR],
    [ChainType.SOLANA]: [
        TokenTicker.SOL,
        TokenTicker.USDC,
        TokenTicker.USDT,
    ],
} as const;