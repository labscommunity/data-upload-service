import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { UPLOAD_QUEUE } from '../../../core/queue/queue.constants';
import { UploadFileJobDto } from '../dto/upload-file-job.dto';

@Injectable()
export class UploadProducer {
    constructor(@InjectQueue(UPLOAD_QUEUE) private uploadQueue: Queue) { }

    async uploadFile(payload: UploadFileJobDto) {
        return await this.uploadQueue.add(`uploadFileToArweave`, payload);
    }
}