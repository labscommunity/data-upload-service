import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { FEE_QUEUE } from '../../../core/queue/queue.constants';
import { ExtractFeeDto } from '../dto/extract-fee.dto';

@Injectable()
export class FeeProducer {
    constructor(@InjectQueue(FEE_QUEUE) private feeQueue: Queue) { }

    async extractFee(payload: ExtractFeeDto) {
        return await this.feeQueue.add(`extractFee`, payload);
    }
}