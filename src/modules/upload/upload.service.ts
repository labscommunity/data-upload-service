import { Injectable } from '@nestjs/common';

import { PriceFeedService } from '../token/price-feed.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { EstimatesDto } from './dto/estimates.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';

@Injectable()
export class UploadService {
  constructor(
    private readonly priceFeedService: PriceFeedService,
  ) { }

  create(createUploadDto: CreateUploadDto) {
    return 'This action adds a new upload';
  }

  findAll() {
    return `This action returns all upload`;
  }

  findOne(id: number) {
    return `This action returns a #${id} upload`;
  }

  update(id: number, updateUploadDto: UpdateUploadDto) {
    return `This action updates a #${id} upload`;
  }

  remove(id: number) {
    return `This action removes a #${id} upload`;
  }

  async getCostEstimate(estimatesDto: EstimatesDto) {
    const costInUSD = await this.priceFeedService.getUploadCostEstimateInUSD(estimatesDto.size);
    const costInToken = await this.priceFeedService.convertToTokenAmount(costInUSD, estimatesDto.tokenTicker);

    const ticker = estimatesDto.tokenTicker.toLowerCase();
    return {
      size: estimatesDto.size,
      usd: costInUSD,
      [ticker]: costInToken,
    };
  }
}
