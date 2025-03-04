import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class ReceiptService {
  constructor(private readonly databaseService: DatabaseService) { }

  findAll(userWalletAddress: string) {
    return this.databaseService.receipt.findMany({
      where: {
        userWalletAddress
      }
    });
  }

  findOne(id: string, userWalletAddress: string) {
    return this.databaseService.receipt.findUnique({
      where: {
        id,
        userWalletAddress
      }
    });
  }
}
