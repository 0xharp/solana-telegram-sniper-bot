import { validateEnv, parseTakeProfitLevels } from './validation';
import { TakeProfitLevel } from '../models/types';

validateEnv();

export interface Config {
    telegram: {
        apiId: number;
        apiHash: string;
        stringSession: string;
        channelsToMonitor: string[];
    };
    solana: {
        rpcUrl: string;
        walletPrivateKey: string;
        buyAmountSol: number;
    };
    jupiter: {
        apiKey: string;
    };
    trading: {
        stopLossPercent: number;
        takeProfitLevels: TakeProfitLevel[];
        slippageBps: number;
        priceCheckIntervalMs: number;
        maxBuyRetries: number;
        retryDelayMs: number;
    };
}

export const config: Config = {
    telegram: {
        apiId: parseInt(process.env.TELEGRAM_API_ID!),
        apiHash: process.env.TELEGRAM_API_HASH!,
        stringSession: process.env.TELEGRAM_SESSION || '',
        channelsToMonitor: process.env.TELEGRAM_CHANNELS!.split(',').map(c => c.trim()).filter(c => c)
    },

    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL!,
        walletPrivateKey: process.env.SOLANA_WALLET_PRIVATE_KEY!,
        buyAmountSol: parseFloat(process.env.SOLANA_BUY_AMOUNT!),
    },

    jupiter: {
        apiKey: process.env.JUPITER_API_KEY!,
    },

    trading: {
        stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT!),
        takeProfitLevels: parseTakeProfitLevels(process.env.TAKE_PROFIT_LEVELS),
        slippageBps: parseInt(process.env.SLIPPAGE_BPS!),
        priceCheckIntervalMs: parseInt(process.env.PRICE_CHECK_INTERVAL_MS!),
        maxBuyRetries: parseInt(process.env.MAX_BUY_RETRIES!),
        retryDelayMs: parseInt(process.env.RETRY_DELAY_MS!),
    }
};