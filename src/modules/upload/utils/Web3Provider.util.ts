import { BadRequestException } from '@nestjs/common';
import { ChainType, Network } from '@prisma/client';
import { Connection } from '@solana/web3.js';
import { ethers, Provider } from 'ethers';


export const evmChainIdMap = {
    1: "eth-mainnet",
    8453: "base-mainnet",
    84532: "base-sepolia",
}

/**
 * Web3Provider class acts as a factory to build web3 clients.
 * It supports both EVM and Solana based on the provided chain type and network.
 */
export class Web3Provider {
    /**
     * Returns an ethers.js provider for EVM networks.
     * @param network - Network type (MAINNET or TESTNET).
     */
    public static getEvmProvider(chainId: number): Provider {
        const rpcPrefix = evmChainIdMap[chainId];

        if (!rpcPrefix) {
            throw new BadRequestException(`Unsupported chainId: ${chainId}`);
        }

        const rpcUrl: string = `https://${rpcPrefix}.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`;
        return new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Returns a Solana connection using @solana/web3.js.
     * @param network - Network type (MAINNET or TESTNET).
     */
    public static getSolanaConnection(network: Network): Connection {
        let prefix: string;
        if (network === Network.mainnet) {
            // Use an environment variable or fallback to Solana mainnet-beta endpoint.
            prefix = "solana-mainnet";
        } else {
            // Use an environment variable or fallback to Solana testnet endpoint.
            prefix = "solana-devnet";
        }

        if (!prefix) {
            throw new BadRequestException("Unsupported network for solana connection");
        }

        const endpoint: string = `https://${prefix}.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`;
        return new Connection(endpoint, 'confirmed');
    }

    /**
     * Returns a web3 client based on the chain type and network.
     * @param chainType - The type of blockchain (EVM or SOLANA).
     * @param network - The network to connect to (MAINNET or TESTNET).
     */
    public static getProvider(chainType: ChainType, network: Network, chainId: number): Provider | Connection {
        if (chainType === ChainType.evm) {
            return this.getEvmProvider(chainId);
        } else if (chainType === ChainType.solana) {
            return this.getSolanaConnection(network);
        } else {
            throw new Error('Unsupported chain type');
        }
    }
}
