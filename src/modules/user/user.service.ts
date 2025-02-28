import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

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
      }
    });
  }

  async createUser(data: CreateUserDto) {
    return this.databaseService.user.create({
      data, include: {
        paymentTransactions: true,
        uploads: true,
        receipts: true,
      }
    });
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
