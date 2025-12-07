# 🤖 Solana Telegram Sniper Bot

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-green.svg)](https://solana.com/)

**A powerful automated trading bot that monitors Telegram channels and executes trades on Solana using your defined trading strategies.**

[Features](#-features) • [Quick Start](#-quick-start) • [Configuration](#-configuration) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

This bot automatically monitors Telegram channels for Solana token addresses and executes trades with configurable stop-loss and take-profit strategies. Built with enterprise-grade architecture, it's designed for reliability, maintainability, and performance.

## ✨ Features

### Core Trading Features
- 🎯 **Auto-Buy** - Instantly buys tokens posted in monitored Telegram channels
- 📊 **Real-Time Monitoring** - Tracks positions with Jupiter Price API v3
- 💰 **Smart Exit Strategy** - Multi-level take-profit with configurable stop-loss
- 🔄 **Retry Logic** - Automatically retries failed transactions
- 🛡️ **Duplicate Prevention** - Never buys the same token twice
- ⚡ **Jupiter Ultra Integration** - Uses fastest execution routes

### Risk Management
- **Stop Loss**: Automatic sell at configurable loss percentage (default: -50%)
- **Take Profit Levels**: Multiple configurable profit-taking levels (e.g., 2x, 4x, 8x)
- **Position Tracking**: Real-time P&L calculation and monitoring
- **Slippage Protection**: Configurable slippage tolerance

### Technical Features
- 📱 **Telegram Integration** - Monitor any public Telegram channel
- 🔐 **Secure Configuration** - Environment-based secrets management
- 📝 **Detailed Logging** - Track all trades and decisions
- 🏗️ **Modular Architecture** - Clean separation of concerns
- 🔧 **Fully Configurable** - All parameters via `.env` file

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- Solana wallet with SOL for trading
- Telegram API credentials
- Jupiter API key

### Installation
```bash
# Clone the repository
git clone https://github.com/0xharp/solana-telegram-sniper-bot.git
cd solana-telegram-sniper-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Edit `.env` file with your credentials:
```env
# Telegram Configuration
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=  # Leave empty on first run
TELEGRAM_CHANNELS=channel1,channel2

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_base58_private_key
SOLANA_BUY_AMOUNT=0.1

# Jupiter API
JUPITER_API_KEY=your_jupiter_api_key

# Trading Strategy
STOP_LOSS_PERCENT=50
TAKE_PROFIT_LEVELS=2:50,4:50,8:50,16:100
SLIPPAGE_BPS=1000
PRICE_CHECK_INTERVAL_MS=5000
MAX_BUY_RETRIES=3
RETRY_DELAY_MS=5000
```

### Running the Bot
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### First Run

On first run, you'll be prompted to:
1. Enter your Telegram phone number (with country code)
2. Enter the verification code sent to Telegram
3. Enter 2FA password (if enabled)

Save the session string printed to console in your `.env` file to avoid re-authentication.

## 📖 Configuration Guide

### Telegram Setup

1. **Get API Credentials**:
    - Go to https://my.telegram.com or https://my.telegram.org
    - Login and create a new application
    - Copy `api_id` and `api_hash`

2. **Find Channel Usernames**:
    - Open channel in Telegram
    - Look at the channel link: `t.me/channel_username`
    - Use the username (without @) in `TELEGRAM_CHANNELS`

### Solana Wallet

**⚠️ Security Warning**: Use a dedicated trading wallet, not your main wallet.
```bash
# Get your wallet private key (base58 format)
# From Phantom: Settings → Show Secret Recovery Phrase
# Convert to base58 using solana-keygen or similar tool
```

### Jupiter API Key

Get your free API key from https://dev.jup.ag/

### Trading Strategy Examples

**Conservative (Quick Profits)**:
```env
STOP_LOSS_PERCENT=30
TAKE_PROFIT_LEVELS=1.5:40,2:30,3:30
```

**Moderate (Balanced)**:
```env
STOP_LOSS_PERCENT=50
TAKE_PROFIT_LEVELS=2:50,4:50,8:100
```

**Aggressive (Moon or Bust)**:
```env
STOP_LOSS_PERCENT=70
TAKE_PROFIT_LEVELS=10:30,50:40,100:30
```

## 🏗️ Architecture
```
src/
├── config/              # Configuration management
│   ├── index.ts         # Main config export
│   └── validation.ts    # Environment validation
├── services/            # Business logic services
│   ├── TradingBot.ts    # Core trading logic
│   ├── JupiterService.ts # Jupiter API integration
│   ├── TelegramMonitor.ts # Telegram integration
│   └── SolanaService.ts  # Solana blockchain interactions
├── models/              # TypeScript interfaces
│   └── types.ts         # Type definitions
├── utils/               # Utility functions
│   ├── logger.ts        # Logging utility
│   └── constants.ts     # Constants
└── index.ts             # Application entry point
```

### Design Principles

- **Separation of Concerns**: Each service handles one responsibility
- **Dependency Injection**: Services are injected, making testing easier
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Handling**: Comprehensive error handling and logging
- **Configuration**: All settings externalized to environment variables

## 📊 How It Works

### 1. Token Detection
```
Telegram Channel → Bot detects Solana address → Validates format
```

### 2. Purchase Execution
```
Get quote from Jupiter → Execute swap → Create position → Start monitoring
```

### 3. Position Management
```
Monitor price every 5s → Check stop-loss → Check take-profit → Execute sells
```

### 4. Example Trade Flow
```
1. Token detected: ABC123...
2. Buy 0.1 SOL worth at $0.00001
3. Monitor position in real-time

Price Movements:
- Reaches 2x ($0.00002) → Sell 50%
- Reaches 4x ($0.00004) → Sell 50% of remaining
- Falls to -50% → Sell all (stop-loss)
```

## ⚠️ Important Warnings

### Financial Risks
- **High Risk**: Crypto trading is extremely risky
- **Loss of Funds**: You can lose your entire investment
- **Scams**: Many tokens are scams or rug pulls
- **No Guarantees**: This bot does not guarantee profits

### Technical Risks
- **Bugs**: Software may contain bugs
- **RPC Issues**: Blockchain RPCs can be unreliable
- **Slippage**: Actual prices may differ from quotes
- **Front-running**: MEV bots may front-run your trades

### Best Practices
- ✅ Start with small amounts
- ✅ Use a dedicated wallet
- ✅ Test on devnet first
- ✅ Monitor closely initially
- ✅ Set conservative stop-losses
- ✅ Never invest more than you can afford to lose

## 🛠️ Troubleshooting

### Common Issues

**Bot doesn't detect messages**:
```bash
# Make sure you're a member of the channel
# Check channel username is correct (without @)
# Verify TELEGRAM_CHANNELS in .env
```

**Transactions fail**:
```bash
# Increase slippage: SLIPPAGE_BPS=2000
# Check wallet has enough SOL
# Try a paid RPC provider (Helius, QuickNode)
```

**Price tracking errors**:
```bash
# Token might be too new for Jupiter Price API
# Bot will fall back to quote-based pricing
# This is normal for brand new tokens
```

### Debug Mode

Enable detailed logging:
```env
DEBUG=true
```

## 📈 Roadmap

### Phase 1: Core Features ✅
- [x] Basic trading functionality
- [x] Telegram integration
- [x] Stop-loss and take-profit
- [x] Retry logic
- [x] Clean architecture

### Phase 2: Enhanced Features 🚧
- [ ] Web dashboard for monitoring
- [ ] Multi-wallet support
- [ ] Trade history and analytics
- [ ] Discord notifications
- [ ] Webhook integration

### Phase 3: Advanced Features 🔮
- [ ] Backtesting engine
- [ ] Copy trading functionality
- [ ] AI-powered signal filtering
- [ ] Risk scoring for tokens
- [ ] Multi-chain support (BNB, Ethereum, Base)

### Development Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests (when available)
npm test

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Jupiter Aggregator** - Best-in-class swap aggregation
- **Solana Foundation** - High-performance blockchain
- **Telegram** - Messaging platform
- **Community** - For feedback and support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/0xharp/solana-telegram-sniper-bot/issues)
- **Twitter**: [@0xharp](https://twitter.com/0xharp)
- **Discussions**: [GitHub Discussions](https://github.com/0xharp/solana-telegram-sniper-bot/discussions)
- **Email**: [hello@0xharp.dev](mailto:hello@0xharp.dev)

## ⚖️ Disclaimer

This software is for educational purposes only. Use at your own risk. The authors are not responsible for any financial losses incurred while using this bot. Always do your own research and never invest more than you can afford to lose.

---

<div align="center">

**Built with ❤️ by [@0xharp](https://twitter.com/0xharp)**

*Learning Web3 in public* 🚀

[⭐ Star this repo](https://github.com/0xharp/solana-telegram-sniper-bot) if you find it useful!

</div>