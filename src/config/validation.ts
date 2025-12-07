export function validateEnv(): void {
    const required = [
        'TELEGRAM_API_ID',
        'TELEGRAM_API_HASH',
        'TELEGRAM_CHANNELS',
        'SOLANA_RPC_URL',
        'SOLANA_WALLET_PRIVATE_KEY',
        'SOLANA_BUY_AMOUNT',
        'JUPITER_API_KEY',
        'STOP_LOSS_PERCENT',
        'SLIPPAGE_BPS',
        'PRICE_CHECK_INTERVAL_MS',
        'MAX_BUY_RETRIES',
        'RETRY_DELAY_MS',
        'TAKE_PROFIT_LEVELS'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Please create a .env file with all required variables.');
        console.error('   See .env.example for reference.\n');
        process.exit(1);
    }

    const numericFields = [
        { key: 'TELEGRAM_API_ID', parser: parseInt },
        { key: 'SOLANA_BUY_AMOUNT', parser: parseFloat },
        { key: 'STOP_LOSS_PERCENT', parser: parseFloat },
        { key: 'SLIPPAGE_BPS', parser: parseInt },
        { key: 'PRICE_CHECK_INTERVAL_MS', parser: parseInt },
        { key: 'MAX_BUY_RETRIES', parser: parseInt },
        { key: 'RETRY_DELAY_MS', parser: parseInt },
    ];

    for (const field of numericFields) {
        const value = field.parser(process.env[field.key] || '');
        if (isNaN(value)) {
            console.error(`❌ ${field.key} must be a valid number`);
            process.exit(1);
        }
    }
}

export function parseTakeProfitLevels(levelsString: string | undefined): Array<{ multiplier: number; percent: number }> {
    if (!levelsString) {
        throw new Error('TAKE_PROFIT_LEVELS is required in .env file');
    }

    try {
        const levels = levelsString.split(',').map(level => {
            const [multiplier, percent] = level.trim().split(':');
            if (!multiplier || !percent) {
                throw new Error('Invalid format');
            }
            return {
                multiplier: parseFloat(multiplier),
                percent: parseFloat(percent)
            };
        });

        if (levels.length === 0) {
            throw new Error('At least one take profit level is required');
        }

        return levels;
    } catch (error) {
        throw new Error(`Error parsing TAKE_PROFIT_LEVELS: ${error}. Format should be: multiplier:percent,multiplier:percent`);
    }
}