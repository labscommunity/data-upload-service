import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import {
    SigningStargateClient,
    StargateClient,
} from '@cosmjs/stargate'
import { BadRequestException } from '@nestjs/common'
import { ChainType } from '@prisma/client'
import { Connection } from '@solana/web3.js'
import Arweave from 'arweave/node'
import { ethers, Provider, Signer } from 'ethers'

/**
 * EVM: map from numeric chainId → Alchemy prefix
 */
export const evmChainIdMap: Record<number, string> = {
    1: 'eth-mainnet',
    8453: 'base-mainnet',
    84532: 'base-sepolia',
}

/**
 * map from your numeric chainId → { chainId, rpc endpoint, bech32 prefix }
 */
export const cosmosChainIdMap: Record<
    number,
    { chainId: string; rpc: string; prefix: string }
> = {
    1: {
        chainId: 'noble-1',
        rpc: process.env.NOBLE_MAINNET_RPC_URL ??
            'https://noble-rpc.polkachu.com',
        prefix: process.env.NOBLE_MAINNET_PREFIX ?? 'noble',
    },
    2: {
        chainId: 'noble-testnet-1',
        rpc: process.env.NOBLE_TESTNET_RPC_URL ??
            'https://rpc.testnet.noble.strange.love',
        prefix: process.env.NOBLE_TESTNET_PREFIX ?? 'noble-testnet',
    },
}

export class Web3Provider {
    /** EVM */
    public static getEvmProvider(chainId: number): Provider {
        const prefix = evmChainIdMap[chainId]
        if (!prefix) {
            throw new BadRequestException(`Unsupported EVM chainId: ${chainId}`)
        }
        const url = `https://${prefix}.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`
        return new ethers.JsonRpcProvider(url)
    }

    /** Solana (unchanged—still keyed off chainId if you want) */
    public static getSolanaConnection(chainId: number): Connection {
        // you could introduce a solanaChainMap here in the same way
        const endpoint =
            chainId === 1
                ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`
                : `https://solana-devnet.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`

        return new Connection(endpoint, 'confirmed')
    }

    /**
     * Universal provider
     */
    public static async getProvider(
        chainType: ChainType,
        chainId: number
    ): Promise<Provider | Connection | Arweave | StargateClient> {
        switch (chainType) {
            case ChainType.evm:
                return this.getEvmProvider(chainId)

            case ChainType.solana:
                return this.getSolanaConnection(chainId)

            case ChainType.arweave:
                return Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' })

            case ChainType.cosmos: {
                const info = cosmosChainIdMap[chainId]
                if (!info) {
                    throw new BadRequestException(`Unsupported Cosmos chainId: ${chainId}`)
                }
                
                return StargateClient.connect(info.rpc)
            }

            default:
                throw new BadRequestException(`Unsupported chain type: ${chainType}`)
        }
    }

    /**
     * Universal signer
     */
    public static async getSigner(
        chainType: ChainType,
        chainId: number,
        privateKey: string
    ): Promise<Signer | SigningStargateClient> {
        switch (chainType) {
            case ChainType.evm: {
                const provider = this.getEvmProvider(chainId)
                return new ethers.Wallet(privateKey, provider)
            }

            case ChainType.solana:
                throw new BadRequestException('Solana signer not implemented')

            case ChainType.cosmos: {
                const info = cosmosChainIdMap[chainId]
                if (!info) {
                    throw new BadRequestException(`Unsupported Cosmos chainId: ${chainId}`)
                }
                // here we treat privateKey as a mnemonic
                const wallet = await DirectSecp256k1HdWallet.fromMnemonic(privateKey, {
                    prefix: info.prefix,
                })
                return SigningStargateClient.connectWithSigner(info.rpc, wallet)
            }

            default:
                throw new BadRequestException(`Unsupported chain type: ${chainType}`)
        }
    }
}
