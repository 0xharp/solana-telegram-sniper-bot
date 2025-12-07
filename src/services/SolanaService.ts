import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { Logger } from '../utils/logger';
import { DEFAULT_TOKEN_DECIMALS, LAMPORTS_PER_SOL } from '../utils/constants';

export class SolanaService {
    private connection: Connection;
    private wallet: Keypair;

    constructor(rpcUrl: string, privateKey: string) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
        Logger.info(`Wallet: ${this.wallet.publicKey.toString()}`);
    }

    getWallet(): Keypair {
        return this.wallet;
    }

    getConnection(): Connection {
        return this.connection;
    }

    async getWalletBalance(): Promise<number> {
        try {
            const balance = await this.connection.getBalance(this.wallet.publicKey);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            Logger.error('Error fetching wallet balance:', error);
            throw error;
        }
    }

    async printWalletBalance(minRequired: number): Promise<void> {
        const balance = await this.getWalletBalance();

        Logger.info(`\nWallet Balance: ${balance.toFixed(4)} SOL`);
        Logger.info(`Address: ${this.wallet.publicKey.toString()}`);

        if (balance < minRequired) {
            Logger.warn(`Balance (${balance.toFixed(4)} SOL) is less than buy amount (${minRequired} SOL)`);
        }
    }

    async getTokenDecimals(tokenMint: string): Promise<number> {
        try {
            const mintPubkey = new PublicKey(tokenMint);
            const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);

            if (mintInfo.value && 'parsed' in mintInfo.value.data) {
                const decimals = mintInfo.value.data.parsed.info.decimals;
                return decimals;
            }

            return DEFAULT_TOKEN_DECIMALS;
        } catch (error) {
            Logger.warn(`Could not fetch decimals for ${tokenMint.slice(0, 8)}..., assuming ${DEFAULT_TOKEN_DECIMALS}`);
            return DEFAULT_TOKEN_DECIMALS;
        }
    }

    validateTokenAddress(address: string): boolean {
        try {
            new PublicKey(address);
            return true;
        } catch {
            return false;
        }
    }
}