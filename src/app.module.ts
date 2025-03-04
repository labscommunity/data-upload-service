import { Module } from '@nestjs/common';

import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReceiptModule } from './modules/receipt/receipt.module';
import { TokenModule } from './modules/token/token.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [CoreModule, AuthModule, UserModule, UploadModule, TokenModule, ReceiptModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  //
}
