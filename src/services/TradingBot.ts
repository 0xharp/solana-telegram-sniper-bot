import { Position } from '../models/types';
import { SolanaService } from './SolanaService';
import { JupiterService } from './JupiterService';
import { Logger } from '../utils/logger';
import { SOL_MINT, LAMPORTS_PER_SOL, DUST_THRESHOLD } from '../utils/constants';
import { config } from '../config';

export class TradingBot {
    private solanaService: SolanaService;
    private jupiterService: JupiterService;
    private positions: Map<string, Position>;
    private monitoringIntervals: Map<string, NodeJS.Timeout>;
    private purchasedTokens: Set<string>;
    private buyRetryQueue: Map<string, number>;

    constructor(solanaService: SolanaService, jupiterService: JupiterService) {
        this.solanaService = solanaService;
        this.jupiterService = jupiterService;
        this.positions = new Map();
        this.monitoringIntervals = new Map();
        this.purchasedTokens = new Set();
        this.buyRetryQueue = new Map();

        this.startRetryProcessor();
    }

    async initialize(): Promise<void> {
        await this.solanaService.printWalletBalance(config.solana.buyAmountSol);
    }

    async executeBuy(tokenAddress: string, isRetry: boolean = false): Promise<boolean> {
        try {
            if (this.purchasedTokens.has(tokenAddress)) {
                Logger.info(`Skipping ${tokenAddress.slice(0, 8)}... - already purchased`);
                return false;
            }

            if (!isRetry) {
                Logger.info(`\nAttempting to buy token: ${tokenAddress}`);
            } else {
                const retryCount = this.buyRetryQueue.get(tokenAddress) || 0;
                Logger.info(`Retry attempt ${retryCount}/${config.trading.maxBuyRetries} for ${tokenAddress.slice(0, 8)}...`);
            }

            if (!this.solanaService.validateTokenAddress(tokenAddress)) {
                Logger.error('Invalid token address');
                return false;
            }

            const amountLamports = Math.floor(config.solana.buyAmountSol * LAMPORTS_PER_SOL);

            Logger.info(`Getting quote for ${config.solana.buyAmountSol} SOL...`);
            const quote = await this.jupiterService.getQuote(
                SOL_MINT,
                tokenAddress,
                amountLamports,
                config.trading.slippageBps,
                this.solanaService.getWallet().publicKey.toString()
            );

            if (!quote) {
                Logger.error('Failed to get quote');
                return false;
            }

            Logger.info('Executing swap...');
            const signature = await this.jupiterService.executeSwap(quote, this.solanaService.getWallet());

            if (!signature) {
                Logger.error('Swap failed');
                return false;
            }

            const tokenDecimals = await this.solanaService.getTokenDecimals(tokenAddress);
            const inputAmount = Number(quote.inputAmountResult || quote.totalInputAmount || amountLamports);
            const outputAmount = Number(quote.outputAmountResult || quote.totalOutputAmount || quote.outAmount);

            const entryPriceNative = inputAmount / outputAmount;
            const solSpent = inputAmount / LAMPORTS_PER_SOL;
            const tokensReceived = outputAmount / Math.pow(10, tokenDecimals);
            const entryPriceHuman = solSpent / tokensReceived;

            Logger.success('Position opened successfully!');
            Logger.info(`   Spent: ${solSpent.toFixed(6)} SOL`);
            Logger.info(`   Received: ${tokensReceived.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})} tokens`);
            Logger.info(`   Entry Price: ${entryPriceHuman.toFixed(10)} SOL per token`);
            Logger.info(`   Token Decimals: ${tokenDecimals}`);

            const position: Position = {
                tokenAddress,
                entryPrice: entryPriceNative,
                initialAmount: outputAmount,
                currentAmount: outputAmount,
                costSol: solSpent,
                realizedProfitSol: 0,
                takeProfitIndex: 0,
                createdAt: new Date()
            };

            this.positions.set(tokenAddress, position);
            this.purchasedTokens.add(tokenAddress);
            this.buyRetryQueue.delete(tokenAddress);
            this.startMonitoring(tokenAddress);

            return true;
        } catch (error) {
            Logger.error('Buy error:', error);

            const retryCount = this.buyRetryQueue.get(tokenAddress) || 0;
            if (retryCount < config.trading.maxBuyRetries) {
                this.buyRetryQueue.set(tokenAddress, retryCount + 1);
                Logger.info(`Added to retry queue (attempt ${retryCount + 1}/${config.trading.maxBuyRetries})`);
            } else {
                Logger.error(`Max retries reached for ${tokenAddress.slice(0, 8)}... - giving up`);
                this.buyRetryQueue.delete(tokenAddress);
            }

            return false;
        }
    }

    async executeSell(tokenAddress: string, amountToSell: number): Promise<boolean> {
        try {
            Logger.info(`\nSelling ${amountToSell} tokens of ${tokenAddress}`);

            const quote = await this.jupiterService.getQuote(
                tokenAddress,
                SOL_MINT,
                Math.floor(amountToSell),
                config.trading.slippageBps,
                this.solanaService.getWallet().publicKey.toString()
            );

            if (!quote) {
                Logger.error('Failed to get sell quote');
                return false;
            }

            const solReceived = Number(quote.outAmount) / LAMPORTS_PER_SOL;
            Logger.trade(`Will receive ${solReceived} SOL`);

            const signature = await this.jupiterService.executeSwap(quote, this.solanaService.getWallet());

            if (!signature) {
                Logger.error('Sell failed');
                return false;
            }

            Logger.success(`Sold successfully! Received ${solReceived} SOL`);

            const position = this.positions.get(tokenAddress);
            if (position) {
                position.currentAmount -= amountToSell;
                position.realizedProfitSol += solReceived;

                if (position.currentAmount < DUST_THRESHOLD) {
                    const totalProfit = position.realizedProfitSol - position.costSol;
                    Logger.monitor(`Position closed. Total profit: ${totalProfit.toFixed(6)} SOL`);
                    this.stopMonitoring(tokenAddress);
                    this.positions.delete(tokenAddress);
                }
            }

            return true;
        } catch (error) {
            Logger.error('Sell error:', error);
            return false;
        }
    }

    private startRetryProcessor(): void {
        setInterval(async () => {
            if (this.buyRetryQueue.size === 0) return;

            Logger.info(`\nProcessing retry queue (${this.buyRetryQueue.size} tokens)...`);

            for (const [tokenAddress, retryCount] of this.buyRetryQueue.entries()) {
                if (retryCount >= config.trading.maxBuyRetries) {
                    Logger.info(`Removing ${tokenAddress.slice(0, 8)}... from queue - max retries reached`);
                    this.buyRetryQueue.delete(tokenAddress);
                    continue;
                }

                await new Promise(resolve => setTimeout(resolve, config.trading.retryDelayMs));
                await this.executeBuy(tokenAddress, true);
                break;
            }
        }, config.trading.retryDelayMs * 2);
    }

    private startMonitoring(tokenAddress: string): void {
        if (this.monitoringIntervals.has(tokenAddress)) return;

        Logger.info(`Started monitoring ${tokenAddress}`);

        const interval = setInterval(async () => {
            await this.checkPosition(tokenAddress);
        }, config.trading.priceCheckIntervalMs);

        this.monitoringIntervals.set(tokenAddress, interval);
    }

    private stopMonitoring(tokenAddress: string): void {
        const interval = this.monitoringIntervals.get(tokenAddress);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(tokenAddress);
            Logger.info(`Stopped monitoring ${tokenAddress}`);
        }
    }

    private async checkPosition(tokenAddress: string): Promise<void> {
        const position = this.positions.get(tokenAddress);
        if (!position) return;

        try {
            const priceData = await this.jupiterService.getTokenPriceInSol(tokenAddress);
            if (!priceData) {
                Logger.warn(`Price data unavailable for ${tokenAddress.slice(0, 8)}...`);
                return;
            }

            const { priceInSol: pricePerActualToken, decimals: tokenDecimals } = priceData;
            const currentPriceNative = (pricePerActualToken / Math.pow(10, tokenDecimals)) * LAMPORTS_PER_SOL;
            const priceChange = ((currentPriceNative - position.entryPrice) / position.entryPrice) * 100;

            const tokensHuman = position.currentAmount / Math.pow(10, tokenDecimals);
            const entryPriceHuman = (position.entryPrice / LAMPORTS_PER_SOL) * Math.pow(10, tokenDecimals);
            const currentPriceHuman = pricePerActualToken;
            const currentValueSOL = (currentPriceNative * position.currentAmount) / LAMPORTS_PER_SOL;
            const pnlSOL = currentValueSOL - position.costSol;

            Logger.monitor(`${tokenAddress.slice(0, 8)}...`);
            Logger.info(`   Holdings: ${tokensHuman.toLocaleString(undefined, {maximumFractionDigits: 2})} tokens`);
            Logger.info(`   Entry: ${entryPriceHuman.toFixed(10)} SOL | Current: ${currentPriceHuman.toFixed(10)} SOL`);
            Logger.info(`   Change: ${priceChange.toFixed(2)}% | PnL: ${pnlSOL.toFixed(6)} SOL`);

            if (priceChange <= -config.trading.stopLossPercent) {
                Logger.warn('STOP LOSS HIT! Selling all...');
                await this.executeSell(tokenAddress, position.currentAmount);
                return;
            }

            const tpLevels = config.trading.takeProfitLevels;
            if (position.takeProfitIndex < tpLevels.length) {
                const currentTP = tpLevels[position.takeProfitIndex];
                const targetMultiplier = currentTP.multiplier;

                if (currentPriceNative >= position.entryPrice * targetMultiplier) {
                    const sellPercent = currentTP.percent;
                    const sellAmount = Math.floor((position.currentAmount * sellPercent) / 100);

                    Logger.success(`TAKE PROFIT ${targetMultiplier}x! Selling ${sellPercent}%...`);
                    await this.executeSell(tokenAddress, sellAmount);

                    position.takeProfitIndex++;
                }
            }
        } catch (error: any) {
            Logger.error('Error checking position:', error.message);
        }
    }

    getOpenPositions(): Position[] {
        return Array.from(this.positions.values());
    }

    getPurchasedTokens(): string[] {
        return Array.from(this.purchasedTokens);
    }
}