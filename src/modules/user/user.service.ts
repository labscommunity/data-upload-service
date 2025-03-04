import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ArKeys } from './user.types';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService
  ) { }

  async findUserByWalletAddress(walletAddress: string) {
    return this.databaseService.user.findUnique({
      where: { walletAddress },
      include: {
        paymentTransactions: true,
        uploads: true,
        receipts: true,
        arKeys: false,
      }
    });
  }

  async createUser(data: CreateUserDto) {
    return this.databaseService.user.create({
      data, include: {
        paymentTransactions: true,
        uploads: true,
        receipts: true,
        arKeys: false,
      }
    });
  }

  async hasArKeys(user: User) {
    const arKey = await this.databaseService.arweaveKeyPair.findUnique({ where: { userWalletAddress: user.walletAddress } });

    return !!arKey;
  }

  async setArKeys(user: User, arKeys: ArKeys) {
    const privateKey = Buffer.from(JSON.stringify(arKeys.jwk)).toString('base64');
    const arKey = await this.databaseService.arweaveKeyPair.create({
      data: {
        userWalletAddress: user.walletAddress,
        privateKey,
        address: arKeys.address,
        publicKey: arKeys.publicKey
      }
    });

    return arKey;
  }

  async getArKeys(user: User) {
    const keyPairEntry = await this.databaseService.arweaveKeyPair.findUnique({ where: { userWalletAddress: user.walletAddress } });

    if (!keyPairEntry) {
      return null;
    }

    const jwk = JSON.parse(Buffer.from(keyPairEntry.privateKey, 'base64').toString('utf-8'));
    const publicKey = keyPairEntry.publicKey;
    const address = keyPairEntry.address;

    return { jwk, publicKey, address };
  }

  async setNonce(user: User, nonce: string) {
    const issuedAt = new Date();

    return this.databaseService.user.update({ where: { id: user.id }, data: { nonce, issuedAt } });
  }

  async clearNonce(user: User) {
    return this.databaseService.user.update({ where: { id: user.id }, data: { nonce: null } });
  }

  async setLastSignature(user: User, signature: string) {
    return this.databaseService.user.update({ where: { id: user.id }, data: { lastSignature: signature } });
  }

  async clearLastSignature(user: User) {
    return this.databaseService.user.update({ where: { id: user.id }, data: { lastSignature: null } });
  }

}
