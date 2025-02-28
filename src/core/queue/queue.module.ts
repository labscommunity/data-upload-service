import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LogConsumer } from './log.consumer';
import { LogProducer } from './log.producer';
import { SYSTEM_LOG_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const username = configService.get('redis.username');
        const password = configService.get('redis.password');
        return {
          connection: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
            ...(username && { username }),
            ...(password && { password }),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: SYSTEM_LOG_QUEUE }),
    BullBoardModule.forFeature({
      name: SYSTEM_LOG_QUEUE,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forRoot({
      route: `/queues`,
      adapter: ExpressAdapter,
    }),
  ],
  providers: [LogConsumer, LogProducer],
  exports: [LogConsumer, LogProducer],
})

export class QueueModule { }
