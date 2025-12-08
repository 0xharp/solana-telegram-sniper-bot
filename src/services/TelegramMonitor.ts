import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import { TradingBot } from './TradingBot';
import { Logger } from '../utils/logger';
import { config } from '../config';

export class TelegramMonitor {
    private client: TelegramClient;
    private tradingBot: TradingBot;

    constructor(tradingBot: TradingBot) {
        this.tradingBot = tradingBot;
        const session = new StringSession(config.telegram.stringSession);

        this.client = new TelegramClient(
            session,
            config.telegram.apiId,
            config.telegram.apiHash,
            { connectionRetries: 5 }
        );
    }

    async start(): Promise<void> {
        await this.client.start({
            phoneNumber: async () => this.promptInput('Enter your phone number (with country code):'),
            password: async () => this.promptInput('Enter your 2FA password:'),
            phoneCode: async () => this.promptInput('Enter the code you received:'),
            onError: (err) => Logger.error('Telegram error:', err),
        });

        Logger.success('Connected to Telegram!');

        if (!config.telegram.stringSession || config.telegram.stringSession.length === 0) {
            const sessionString = this.client.session.save();
            Logger.info('Session string:', sessionString);
            Logger.info('Add this to your .env file:');
        } else {
            Logger.info('Using existing session from .env\n');
        }

        this.setupMessageHandler();
    }

    private async promptInput(message: string): Promise<string> {
        console.log(`📱 ${message}`);
        return new Promise(resolve => {
            process.stdin.once('data', data => resolve(data.toString().trim()));
        });
    }

    private setupMessageHandler(): void {
        this.client.addEventHandler(async (event: any) => {
            const message = event.message;
            const chat = await message.getChat();
            const username = chat.username?.toLowerCase();

            if (!username || !config.telegram.channelsToMonitor.includes(username)) {
                return;
            }

            const text = message.message || '';
            Logger.info(`\n📨 New message from @${username}:`);
            Logger.info(`   ${text.slice(0, 100)}...`);

            const solanaAddressRegex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
            const matches = text.match(solanaAddressRegex);
            if (matches && matches.length > 0) {
                Logger.info(`Found ${matches.length} potential token address(es)`);

                for (const address of matches) {
                    if (address.length >= 32 && address.length <= 44) {
                        Logger.success(`Token detected: ${address}`);
                        await this.tradingBot.executeBuy(address);
                    }
                }
            } else {
                Logger.debug('No Solana address detected in this message');
            }
        }, new NewMessage({}));

        Logger.info(`👂 Listening to channels: ${config.telegram.channelsToMonitor.join(', ')}`);
    }
}