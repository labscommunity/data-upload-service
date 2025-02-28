import { Processor, } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { BaseConsumer } from 'src/core/queue/base.consumer';

import { LoggerService } from '../../../core/logger/logger.service';
import { FEE_QUEUE } from '../../../core/queue/queue.constants';
import { ExtractFeeDto } from '../dto/extract-fee.dto';
import { UploadService } from '../upload.service';


@Processor(FEE_QUEUE)
export class FeeConsumer extends BaseConsumer {

    constructor(
        logger: LoggerService,
        private readonly uploadService: UploadService,
        private readonly config: ConfigService
    ) {
        super(logger);
    }

    async process(job: Job<ExtractFeeDto>) {
        const { feeRecordId } = job.data

        await this.uploadService.debitFeeFromSystemWallet(feeRecordId);
    }
}