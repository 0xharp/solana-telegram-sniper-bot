export interface Position {
    tokenAddress: string;
    entryPrice: number;
    initialAmount: number;
    currentAmount: number;
    costSol: number;
    realizedProfitSol: number;
    takeProfitIndex: number;
    createdAt: Date;
}

export interface TakeProfitLevel {
    multiplier: number;
    percent: number;
}

export interface JupiterQuote {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    priceImpactPct: number;
    transaction?: string;
    requestId?: string;
    inputAmountResult?: string;
    outputAmountResult?: string;
    totalInputAmount?: string;
    totalOutputAmount?: string;
    swapEvents?: Array<{
        inputMint: string;
        inputAmount: string;
        outputMint: string;
        outputAmount: string;
    }>;
    [key: string]: any;
}

export interface TokenPriceData {
    usdPrice: number;
    decimals: number;
    blockId: number;
    priceChange24h?: number;
}

export interface PriceResponse {
    [tokenAddress: string]: TokenPriceData;
}