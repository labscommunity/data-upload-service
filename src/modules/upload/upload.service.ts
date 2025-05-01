import { IndexedTx, StargateClient } from '@cosmjs/stargate';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainType, Network, ReceiptStatus, TokenTicker, TransactionStatus, UploadStatus, } from '@prisma/client';
import { Connection, ParsedInstruction } from '@solana/web3.js';
import Arweave from 'arweave/node/common';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { Contract, getAddress, Interface, Provider } from 'ethers';
import * as fs from 'fs';
import path from 'path';
import { paginator } from 'src/common/utils/paginator';
import { DatabaseService } from 'src/database/database.service';
import { pipeline } from 'stream';
import { promisify } from 'util';

import { User } from '../auth/user.types';
import { PriceFeedService } from '../token/price-feed.service';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto';
import { EstimatesDto } from './dto/estimates.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { UploadFileJobDto } from './dto/upload-file-job.dto';
import { UploadProducer } from './queue/upload.producer';
import { Web3Provider } from './utils/Web3Provider.util';
// Minimal ERC20 ABI with Transfer event
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
const pump = promisify(pipeline);

const paginate = paginator({ perPage: 10 });

@Injectable()
export class UploadService {
  constructor(
    private readonly configService: ConfigService,
    private readonly priceFeedService: PriceFeedService,
    private readonly databaseService: DatabaseService,
    private readonly uploadQueue: UploadProducer
  ) { }

  async getCostEstimate(estimatesDto: EstimatesDto) {
    const token = await this.databaseService.token.findFirst({
      where: {
        ticker: estimatesDto.tokenTicker,
        chainType: estimatesDto.chainType,
        chainId: estimatesDto.chainId,
        network: estimatesDto.network,
      },
    });

    if (!token) {
      throw new BadRequestException(
        `Invalid combination of chain type "${estimatesDto.chainType}" and token "${estimatesDto.tokenTicker}"`,
      );
    }
    const costInUSD = await this.priceFeedService.getUploadCostEstimateInUSD(estimatesDto.size);
    const costInToken = await this.priceFeedService.convertToTokenAmount(costInUSD, estimatesDto.tokenTicker, token.decimals);

    const ticker = estimatesDto.tokenTicker.toLowerCase();
    let chainType = estimatesDto.chainType.toLowerCase();

    if (chainType === ChainType.cosmos) {
      chainType = 'cosmos.noble';
    }

    const payAddress = this.configService.get(`${chainType}.address`);

    if (!payAddress) {
      throw new BadRequestException(`Pay address not found for chain type ${chainType}`);
    }

    return {
      size: estimatesDto.size,
      usd: costInUSD,
      [ticker]: costInToken,
      "payAddress": payAddress
    };
  }

  async getUploadRequests({ page = 1, perPage = 10 }: { page?: number, perPage?: number }) {
    return await paginate(this.databaseService.upload, {
      orderBy: {
        createdAt: 'desc'
      }
    }, { page, perPage });
  }

  async getReceipts({ page = 1, perPage = 10 }: { page?: number, perPage?: number }) {
    return await paginate(this.databaseService.receipt, {
      orderBy: {
        createdAt: 'desc'
      }
    }, { page, perPage });
  }

  async createUploadRequest(createUploadRequestDto: CreateUploadRequestDto, user: User) {
    const { totalChunks, uploadType, fileName, size, tokenTicker, mimeType, network, chainId, tags } = createUploadRequestDto
    const { chainType } = user

    const validToken = await this.validateToken(chainType, tokenTicker, chainId, network)

    const costEstimate = await this.getCostEstimate({
      size,
      tokenTicker: tokenTicker,
      chainType,
      chainId,
      network
    })

    const costInToken = costEstimate[tokenTicker.toLowerCase()]

    if (!costInToken) {
      throw new BadRequestException("Invalid token provided. Failed to estimate cost.");
    }

    const paymentTransaction = await this.databaseService.paymentTransaction.create({
      data: {
        userWalletAddress: user.walletAddress,
        tokenId: validToken.id,
        amount: typeof costInToken.amount === 'string' ? costInToken.amount : BigNumber(costInToken.amount).toFixed(),
        amountInSubUnits: typeof costInToken.amountInSubUnits === 'string' ? costInToken.amountInSubUnits : BigNumber(costInToken.amountInSubUnits).toString(),
      }
    })

    const uploadEntry = await this.databaseService.upload.create({
      data: {
        userWalletAddress: user.walletAddress,
        paymentTransactionId: paymentTransaction.id,
        fileName: fileName,
        size: size,
        uploadType: uploadType,
        uploadEstimate: typeof costInToken.amount === 'string' ? costInToken.amount : BigNumber(costInToken.amount).toFixed(),
        uploadEstimateUSD: BigNumber(costEstimate.usd).toFixed(),
        mimeType: mimeType,
        totalChunks: totalChunks,
        tags: tags as any
      }
    })

    return {
      uploadRequest: uploadEntry,
      paymentTransaction: paymentTransaction,
      paymentDetails: costEstimate,
      token: validToken
    }
  }

  async createReceipt({
    uploadId,
    paymentTransactionId,
    tokenId,
    userWalletAddress,
    paymentTxnHash,
    filePath,
  }) {
    const existingReceipt = await this.databaseService.receipt.findUnique({
      where: {
        uploadId
      }
    });

    if (existingReceipt) {
      throw new BadRequestException('Receipt already exists for this upload');
    }

    await this.databaseService.paymentTransaction.update({
      where: {
        id: paymentTransactionId
      },
      data: {
        transactionHash: paymentTxnHash,
        status: TransactionStatus.SUCCEEDED
      }
    })

    await this.databaseService.upload.update({
      where: {
        id: uploadId
      },
      data: {
        fileLocation: filePath,
      }
    })

    const receipt = await this.databaseService.receipt.create({
      data: {
        uploadId,
        tokenId,
        userWalletAddress,
        status: ReceiptStatus.PAID
      }
    })

    return receipt
  }

  async createFeeTransaction(uploadId: string) {
    const upload = await this.getUploadRequest(uploadId);

    if (!upload) {
      throw new BadRequestException('Upload request not found');
    }

    const paymentTransaction = await this.getPaymentTransaction(upload.paymentTransactionId);

    if (!paymentTransaction) {
      throw new BadRequestException('Payment transaction not found');
    }

    const token = await this.getToken(paymentTransaction.tokenId);

    if (!token) {
      throw new BadRequestException('Payment token not found');
    }

    const feePercentage = await this.configService.get('admin.feeConfig.feePercentage');
    const feeAmountInSubUnits = BigNumber(paymentTransaction.amountInSubUnits).times(feePercentage).div(100).integerValue(BigNumber.ROUND_UP).toString();
    const feeAmountInScaledUnits = this.priceFeedService.convertToScaledUnits(feeAmountInSubUnits, token.decimals);


    const feeTransaction = await this.databaseService.feeTransaction.create({
      data: {
        uploadId,
        amount: feeAmountInScaledUnits,
        amountInSubUnits: feeAmountInSubUnits,
      }
    })

    return feeTransaction;
  }

  async verifyPayment({
    tokenAddress,
    paymentTx,
    chainType,
    chainId,
    senderAddress,
    amount,
  }: {
    tokenAddress: string;
    paymentTx: string;
    chainType: ChainType;
    chainId: number;
    senderAddress: string;
    amount: string;
  }) {

    const provider = await Web3Provider.getProvider(chainType, chainId);
    let _chainType = chainType.toLowerCase();
    if (chainType === ChainType.cosmos) {
      _chainType = 'cosmos.noble';
    }
    const systemAddress = this.configService.get(`${_chainType}.address`);

    if (!systemAddress) {
      throw new BadRequestException(`System address not found for chain type ${chainType}`);
    }

    if (chainType === ChainType.evm) {
      const receipt = await (provider as Provider).getTransactionReceipt(paymentTx);

      if (!receipt || !receipt.to) {
        throw new BadRequestException("Transaction receipt not found");
      }


      const status = receipt.status
      const isConfirmed = status === 1;
      console.log({ isConfirmed })
      if (!isConfirmed) {
        throw new BadRequestException("Transaction receipt provided reverted.");
      }
      const isContract = await (provider as Provider).getCode(receipt.to);
      console.log({ isContract })
      if (isContract) {
        console.log("erc20 transfer")
        let tokenTransferFound = false;
        const erc20Interface = new Interface(ERC20_ABI);
        // Filter logs by token contract address and matching Transfer event.
        for (const log of receipt.logs) {
          console.log({ log: JSON.stringify(log, null, 2), to: receipt.to })
          // Filter logs from the specified token contract.
          if (log.address.toLowerCase() === tokenAddress.toLowerCase()) {
            console.log("erc20 transfer found")
            const normalizedTopics = log.topics.map((t) => t.toString());
            const normalizedLog = { ...log, topics: normalizedTopics };
            try {
              const parsedLog = erc20Interface.parseLog(normalizedLog);
              if (!parsedLog) {
                continue;
              }
              console.log({ parsedLog: JSON.stringify(parsedLog, null, 2) })
              // Ensure the log is a Transfer event.
              if (parsedLog.name === 'Transfer') {
                const { from, to, value } = parsedLog.args;
                // Normalize addresses
                if (
                  getAddress(from) === getAddress(senderAddress) &&
                  getAddress(to) === getAddress(systemAddress) &&
                  BigNumber(value).eq(amount)
                ) {
                  console.log({ tokenTransferFound: true, log: JSON.stringify(parsedLog, null, 2) })
                  tokenTransferFound = true;
                  break;
                }
              }
            } catch (error) {
              console.log({ error: error.message })
              // If parsing fails, ignore this log.
              continue;
            }
          }
        }
        if (!tokenTransferFound) {
          throw new BadRequestException("Token transfer not found");
        }
      } else {
        console.log("normal transfer")
        //normal transfer
        const tx = await (provider as Provider).getTransaction(paymentTx);

        if (!tx) {
          throw new BadRequestException("Transaction receipt is invalid");
        }

        const from = tx.from;
        const to = tx.to;
        const value = tx.value;

        if (!to || to.toLowerCase() !== systemAddress.toLowerCase()) {
          throw new BadRequestException("ETH transaction receiver is invalid");
        }
        if (from.toLowerCase() !== senderAddress.toLowerCase()) {
          throw new BadRequestException("ETH transaction sender is invalid");
        }

        if (value !== BigInt(amount)) {
          throw new BadRequestException(
            `Transferred ETH amount ${value.toString()} does not match expected amount ${amount}`
          );
        }
      }

      console.log("returning true")
      return true;
    }

    if (chainType === ChainType.solana) {
      const receipt = await (provider as Connection).getParsedTransaction(paymentTx, {
        commitment: 'confirmed',
      });

      if (!receipt) {
        throw new BadRequestException("Transaction receipt not found");
      }

      if (!receipt.meta || receipt.meta.err !== null) {
        return false;
      }

      // Ensure that the transaction message and instructions are present.
      const instructions = receipt.transaction?.message?.instructions;
      if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
        return false;
      }

      // Iterate over each instruction in the transaction.
      for (const instr of instructions) {
        const parsedInstr = instr as ParsedInstruction;
        // Check if the instruction is parsed and is a transfer.
        if (parsedInstr.parsed && parsedInstr.parsed.type === 'transfer') {
          const info = parsedInstr.parsed.info;
          console.log({ info, amount }) // TODO: Remove and change source to senderAddress
          // Validate that the source, destination, and lamports match the expected values.
          if (
            info &&
            info.source === senderAddress &&
            info.destination === systemAddress &&
            BigNumber(info.lamports).toString() === amount
          ) {
            return true;
          }
        }
      }
    }

    if (chainType === ChainType.arweave) {
      //
      console.log({ paymentTx })
      const tx = await axios.post('https://arweave.net/graphql', {
        query: `query{ transaction(id:"${paymentTx}"){ id, quantity{ winston ar }, owner{ address }, recipient } }`,
      });
      const data = tx.data;
      const transaction = data.data.transaction;
      if (!transaction) {
        return false;
      }
      console.log({ transaction })

      const { quantity, owner, recipient } = transaction;
      const quantityInWinston = quantity.winston;
      const ownerAddress = owner.address;
      const recipientAddress = recipient;

      const valid = BigInt(quantityInWinston) === BigInt(amount) && recipientAddress === systemAddress && ownerAddress === senderAddress;
      return valid;
    }

    if (chainType === ChainType.cosmos) {
      // 1) connect to the chain
      const client = (await Web3Provider.getProvider(
        chainType,
        chainId
      )) as StargateClient;

      // 3) fetch the transaction
      let txResponse: IndexedTx | null;
      try {
        txResponse = await client.getTx(paymentTx);
      } catch (err: any) {
        throw new BadRequestException(`Cosmos tx not found: ${paymentTx}`);
      }
      if (!txResponse) {
        throw new BadRequestException(`Cosmos tx not found: ${paymentTx}`);
      }
      if (txResponse.code !== 0) {
        throw new BadRequestException('Transaction failed on-chain');
      }

      // 4) scan for a transfer event matching sender→system for the correct denom+amount
      const denom = tokenAddress;
      for (const evt of txResponse.events) {
        console.log(JSON.stringify(evt, null, 2))
        if (evt.type !== 'transfer') continue;
        const attrs = evt.attributes.reduce<Record<string, string>>((acc, { key, value }) => {
          acc[key] = value;
          return acc;
        }, {});

        if (
          attrs.sender === senderAddress &&
          attrs.recipient === systemAddress &&
          attrs.amount?.endsWith(denom)
        ) {
          const valueOnly = attrs.amount.slice(0, -denom.length);
          console.log({ valueOnly, amount })
          if (valueOnly === amount) {
            return true;
          }
        }
      }
    }

    return false;
  }

  async getUploadRequest(requestId: string) {
    const uploadRequest = await this.databaseService.upload.findFirst({
      where: {
        id: requestId,
      },
    });

    if (!uploadRequest) {
      throw new BadRequestException("Upload request not found");
    }

    return uploadRequest;
  }

  async getPaymentTransaction(paymentTxId: string) {
    const paymentTransaction = await this.databaseService.paymentTransaction.findFirst({
      where: {
        id: paymentTxId,
      },
    });

    if (!paymentTransaction) {
      throw new BadRequestException("Payment transaction not found");
    }

    return paymentTransaction;
  }

  async getFeeTransaction(feeRecordId: string) {
    const feeTransaction = await this.databaseService.feeTransaction.findFirst({
      where: {
        id: feeRecordId,
      },
      include: {
        upload: true
      }
    });

    if (!feeTransaction) {
      throw new BadRequestException("Fee transaction not found");
    }

    return feeTransaction;
  }

  async getReceiptById(receiptId: string) {
    return await this.databaseService.receipt.findFirst({
      where: {
        id: receiptId,
      },
    });
  }

  async getReceiptByUploadId(uploadId: string) {
    return await this.databaseService.receipt.findFirst({
      where: {
        uploadId,
      },
    });
  }

  async getToken(tokenId: string) {
    const token = await this.databaseService.token.findFirst({
      where: {
        id: tokenId,
      },
    });

    if (!token) {
      throw new BadRequestException("Token not found");
    }

    return token;
  }

  async queueFileToUpload(payload: UploadFileJobDto) {
    return await this.uploadQueue.uploadFile(payload);
  }

  async updateUploadStatus(uploadId: string, status: UploadStatus) {
    return await this.databaseService.upload.update({
      where: { id: uploadId },
      data: { status },
    });
  }

  async updateUploadTxId(uploadId: string, txId: string) {
    return await this.databaseService.upload.update({
      where: { id: uploadId },
      data: { arweaveTxId: txId },
    });
  }

  async updateUploadReceiptStatus(uploadId: string, status: ReceiptStatus) {
    return await this.databaseService.receipt.update({
      where: { uploadId },
      data: { status }
    });
  }

  async updatePaymentTransactionStatus(uploadId: string, status: TransactionStatus) {
    const uploadRequest = await this.getUploadRequest(uploadId);

    if (!uploadRequest) {
      throw new BadRequestException("Upload request not found");
    }
    return await this.databaseService.paymentTransaction.update({
      where: { id: uploadRequest.paymentTransactionId },
      data: { status }
    });
  }

  async debitFeeFromSystemWallet(feeTransactionId: string) {
    const feeTransaction = await this.getFeeTransaction(feeTransactionId);

    if (!feeTransaction) {
      throw new BadRequestException("Fee transaction not found");
    }

    const paymentTransaction = await this.getPaymentTransaction(feeTransaction.upload.paymentTransactionId);

    if (!paymentTransaction) {
      throw new BadRequestException("Payment transaction not found");
    }

    const token = await this.getToken(paymentTransaction.tokenId);

    if (!token) {
      throw new BadRequestException("Token not found");
    }

    let _chainType = token.chainType.toLowerCase();
    if (token.chainType === ChainType.cosmos) {
      _chainType = 'cosmos.noble';
    }
    const systemAddress = this.configService.get(`${_chainType}.address`);
    const systemPrivateKey = this.configService.get(`${_chainType}.pk`);
    const feeAddress = this.configService.get(`admin.feeConfig.addresses.${token.chainType}`);

    if (!systemAddress || !feeAddress) {
      throw new BadRequestException(`System address or fee address not found for chain type ${token.chainType}`);
    }

    const feeAmount = feeTransaction.amountInSubUnits;
    if (ChainType.evm === token.chainType) {
      // Minimal ERC20 ABI with transfer function.
      const ERC20_ABI = [
        "function transfer(address recipient, uint256 amount) external returns (bool)"
      ];
      const signer = await Web3Provider.getSigner(token.chainType, token.chainId, systemPrivateKey);
      const tokenContract = new Contract(token.address, ERC20_ABI, signer as any);
      const feeAmountBN = BigInt(feeAmount);

      const contractSigner = tokenContract.connect(signer as any) as any

      const tx = await contractSigner.transfer(feeAddress, feeAmountBN)

      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new BadRequestException("Fee transaction failed");
      }

      await this.databaseService.feeTransaction.update({
        where: { id: feeTransactionId },
        data: { status: TransactionStatus.SUCCEEDED, transactionHash: tx.hash }
      });
    }

    if (ChainType.solana === token.chainType) {
      //
      throw new BadRequestException("Solana fee debit not implemented");
    }

    if (ChainType.arweave === token.chainType) {
      const jwk = JSON.parse(systemPrivateKey)

      const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
      })
      console.log({ feeAmount })
      const txn = await arweave.createTransaction({ quantity: feeAmount, target: feeAddress })
      await arweave.transactions.sign(txn, jwk)
      const res = await arweave.transactions.post(txn)
      console.log({ res })

      if (res.status !== 200) {
        throw new BadRequestException("Fee transaction failed");
      }

      await this.databaseService.feeTransaction.update({
        where: { id: feeTransactionId },
        data: { status: TransactionStatus.SUCCEEDED, transactionHash: txn.id }
      });
    }

    if (ChainType.cosmos === token.chainType) {
      //
      console.log("not implemented")
      // throw new BadRequestException("Cosmos fee debit not implemented");
    }
  }

  private async validateToken(chainType: ChainType, tokenTicker: TokenTicker, chainId: number, network: Network) {
    const validToken = await this.databaseService.token.findFirst({
      where: {
        ticker: tokenTicker,
        chainType: chainType,
        chainId: chainId,
        network: network,
      },
    });

    if (!validToken) {
      throw new BadRequestException(
        `Invalid combination of chain type "${chainType}" and token "${tokenTicker}"`,
      );
    }

    return validToken;
  }

  async uploadChunk(payload: UploadChunkDto, req: any) {
    const { uploadId, currentChunk: chunkIndex, totalChunks } = payload;

    const uploadRequest = await this.getUploadRequest(uploadId);

    if (!uploadRequest) {
      throw new BadRequestException("Upload request not found");
    }

    if (uploadRequest.totalChunks !== totalChunks) {
      throw new BadRequestException("Total chunks mismatch");
    }
    const notStartedStatus: UploadStatus[] = [UploadStatus.NOT_STARTED, UploadStatus.IN_PROGRESS];

    if (!notStartedStatus.includes(uploadRequest.status)) {
      throw new BadRequestException("Upload is not in progress");
    }

    const uploadsDir = path.join(process.cwd(), `uploads/${uploadRequest.userWalletAddress}`);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, `${uploadRequest.id}.bin`);


    if (chunkIndex !== uploadRequest.currentChunk + 1) throw new BadRequestException(`Invalid chunk order. Expected ${uploadRequest.currentChunk + 1}`);
    const writeStream = fs.createWriteStream(filePath, { flags: chunkIndex === 0 ? 'w' : 'a' });

    await pump(req, writeStream);
    await this.databaseService.upload.update({
      where: { id: uploadId },
      data: { currentChunk: chunkIndex, status: uploadRequest.status === UploadStatus.NOT_STARTED ? UploadStatus.IN_PROGRESS : uploadRequest.status }
    });

    const progress = Math.round((chunkIndex / totalChunks) * 100);

    if (chunkIndex === totalChunks - 1) {
      await this.databaseService.upload.update({
        where: { id: uploadId },
        data: { status: UploadStatus.COMPLETED }
      });

      return {
        status: UploadStatus.COMPLETED,
        totalChunks: uploadRequest.totalChunks,
        currentChunk: uploadRequest.currentChunk,
        progress: progress,
        fileLocation: filePath
      }
    }

    return {
      status: uploadRequest.status,
      totalChunks: uploadRequest.totalChunks,
      currentChunk: uploadRequest.currentChunk,
      progress: progress,
      fileLocation: filePath
    }
  }
}
