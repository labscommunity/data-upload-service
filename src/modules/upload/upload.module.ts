import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UPLOAD_QUEUE } from 'src/core/queue/queue.constants';

import { TokenModule } from '../token/token.module';
import { ChainTokenValidationMiddleware } from './middlewares/chain-token-validation.middleware';
import { UploadConsumer } from './queue/upload.consumer';
import { UploadProducer } from './queue/upload.producer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [BullModule.registerQueue({ name: UPLOAD_QUEUE }),
    BullBoardModule.forFeature({
      name: UPLOAD_QUEUE,
      adapter: BullMQAdapter,
    }),
    TokenModule,
  ],
  controllers: [UploadController],
  providers: [UploadService, UploadConsumer, UploadProducer],
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