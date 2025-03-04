import { Controller, Get, Param, Req } from '@nestjs/common';
import { User } from '@prisma/client';
import { Auth } from 'src/core/auth/decorators/auth.decorator';
import { AuthType } from 'src/core/auth/enums/auth-type.enum';

import { ReceiptService } from './receipt.service';

@Auth(AuthType.Bearer)
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) { }


  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as User

    return this.receiptService.findAll(user.walletAddress);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as User

    return this.receiptService.findOne(id, user.walletAddress);
  }

}
