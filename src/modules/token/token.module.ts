import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PriceFeedService } from './price-feed.service';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';

@Module({
  controllers: [TokenController],
  providers: [TokenService, PriceFeedService, ConfigService],
  exports: [PriceFeedService],
})
export class TokenModule { }
