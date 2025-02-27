import { Processor, WorkerHost, } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DatabaseService } from 'src/database/database.service';

import { CreateLogDto } from '../dto/create-log.dto';
import { SYSTEM_LOG_QUEUE } from './queue.constants';


@Processor(SYSTEM_LOG_QUEUE)
export class LogConsumer extends WorkerHost {
    constructor(
        private readonly databaseService: DatabaseService
    ) {
        super();
    }

    async process(job: Job<CreateLogDto>) {
        await this.databaseService.log.create({
            data: {
                eventType: job.data.eventType,
                message: job.data.message,
                metadata: job.data.metadata,
            }
        })
    }
}