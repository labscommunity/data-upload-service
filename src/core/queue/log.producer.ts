import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CreateLogDto } from '../dto/create-log.dto';
import { SYSTEM_LOG_QUEUE } from './queue.constants';

@Injectable()
export class LogProducer {
    constructor(@InjectQueue(SYSTEM_LOG_QUEUE) private logQueue: Queue) { }

    async log(payload: CreateLogDto) {
        return await this.logQueue.add(`log`, payload);
    }
}