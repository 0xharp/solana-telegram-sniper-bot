import axios from 'axios';
import { VersionedTransaction } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import { JupiterQuote, TokenPriceData } from '../models/types';
import { Logger } from '../utils/logger';
import { SOL_MINT, JUPITER_API } from '../utils/constants';

export class JupiterService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private getHeaders(): Record<string, string> {
        return {
            'Accept': 'application/json',
            'x-api-key': this.apiKey,
        };
    }

    async getQuote(
        inputMint: string,
        outputMint: string,
        amount: number,
        slippageBps: number,
        taker: string
    ): Promise<JupiterQuote | null> {
        try {
            const url = `${JUPITER_API.BASE_URL}${JUPITER_API.ULTRA_ORDER_ENDPOINT}`;

            const response = await axios.get(url, {
                params: { inputMint, outputMint, amount, slippageBps, taker },
                headers: this.getHeaders(),
                timeout: 15000,
            });

            return response.data;
        } catch (error: any) {
            Logger.error('Error getting Jupiter quote:', error.message || error);
            return null;
        }
    }

    async executeSwap(orderResponse: JupiterQuote, wallet: Keypair): Promise<string | null> {
        try {
            if (!orderResponse.transaction) {
                Logger.error('No transaction in order response');
                return null;
            }

            const transactionBuf = Buffer.from(orderResponse.transaction, 'base64');
            const transaction = VersionedTransaction.deserialize(transactionBuf);
            transaction.sign([wallet]);

            const signedTransaction = Buffer.from(transaction.serialize()).toString('base64');
            const url = `${JUPITER_API.BASE_URL}${JUPITER_API.ULTRA_EXECUTE_ENDPOINT}`;

            const { data } = await axios.post(url, {
                signedTransaction,
                requestId: orderResponse.requestId,
            }, {
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/json',
                },
            });

            Logger.debug('Execute Response:', JSON.stringify(data, null, 2));

            if (data.status === 'Success') {
                Logger.success(`Swap executed: https://solscan.io/tx/${data.signature}`);
                return data.signature;
            } else {
                Logger.error('Swap failed:', data);
                return null;
            }
        } catch (error: any) {
            Logger.error('Error executing swap:', error.response?.data || error.message || error);
            return null;
        }
    }

    async getTokenPrice(tokenMint: string): Promise<TokenPriceData | null> {
        try {
            const url = `${JUPITER_API.BASE_URL}${JUPITER_API.PRICE_ENDPOINT}`;
            const response = await axios.get(url, {
                params: { ids: `${tokenMint},${SOL_MINT}` },
                headers: this.getHeaders(),
                timeout: 5000,
            });

            const tokenData = response.data[tokenMint];
            const solData = response.data[SOL_MINT];

            if (!tokenData || !solData) {
                return null;
            }

            return tokenData;
        } catch (error: any) {
            Logger.error(`Error fetching price for ${tokenMint.slice(0, 8)}:`, error.message);
            return null;
        }
    }

    async getTokenPriceInSol(tokenMint: string): Promise<{ priceInSol: number; decimals: number } | null> {
        try {
            const url = `${JUPITER_API.BASE_URL}${JUPITER_API.PRICE_ENDPOINT}`;
            const response = await axios.get(url, {
                params: { ids: `${tokenMint},${SOL_MINT}` },
                headers: this.getHeaders(),
                timeout: 5000,
            });

            const tokenData = response.data[tokenMint];
            const solData = response.data[SOL_MINT];

            if (!tokenData || !tokenData.usdPrice || !solData || !solData.usdPrice) {
                return null;
            }

            const priceInSol = tokenData.usdPrice / solData.usdPrice;
            return { priceInSol, decimals: tokenData.decimals };
        } catch (error: any) {
            Logger.debug(`Price API unavailable for ${tokenMint.slice(0, 8)}, will use quote method`);
            return null;
        }
    }
}