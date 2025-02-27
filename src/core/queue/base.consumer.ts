import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { LoggerService } from '../logger/logger.service';

export abstract class BaseConsumer extends WorkerHost {
    constructor(protected readonly logger: LoggerService) {
        super();
    }
    @OnWorkerEvent('failed')
    onError(job: Job<any>, error: any) {
        this.logger.error(
            `Failed job ${job.id} of type ${job.name}: ${error.message}`,
            error.stack,
            `Queue`,
            job.data,
        );
    }
}