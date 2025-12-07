import dotenv from 'dotenv';
dotenv.config();

import { SolanaService } from './services/SolanaService';
import { JupiterService } from './services/JupiterService';
import { TradingBot } from './services/TradingBot';
import { TelegramMonitor } from './services/TelegramMonitor';
import { Logger } from './utils/logger';
import { config } from './config';

async function main() {
    Logger.info('🤖 Solana Auto-Trading Bot Starting...\n');

    // Initialize services
    const solanaService = new SolanaService(config.solana.rpcUrl, config.solana.walletPrivateKey);
    const jupiterService = new JupiterService(config.jupiter.apiKey);

    // Initialize trading bot
    const tradingBot = new TradingBot(solanaService, jupiterService);
    await tradingBot.initialize();

    // Initialize and start Telegram monitor
    const telegramMonitor = new TelegramMonitor(tradingBot);
    await telegramMonitor.start();

    Logger.success('\nBot is now running and monitoring channels!');
    Logger.info('Press Ctrl+C to stop\n');

    // Graceful shutdown
    process.on('SIGINT', () => {
        Logger.info('\n👋 Shutting down...');
        process.exit(0);
    });
}

main().catch((error) => {
    Logger.error('Fatal error:', error);
    process.exit(1);
});