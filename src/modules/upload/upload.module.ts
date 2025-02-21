import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';

import { TokenModule } from '../token/token.module';
import { ChainTokenValidationMiddleware } from './middlewares/chain-token-validation.middleware';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [TokenModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ChainTokenValidationMiddleware)
      .forRoutes({
        path: 'upload/cost',
        method: RequestMethod.POST
      });
  }
}