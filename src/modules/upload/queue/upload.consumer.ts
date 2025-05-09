import { OnWorkerEvent, Processor, } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReceiptStatus, UploadStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { readFile, unlink } from 'fs/promises';
import { BaseConsumer } from 'src/core/queue/base.consumer';

import { LoggerService } from '../../../core/logger/logger.service';
import { UPLOAD_QUEUE } from '../../../core/queue/queue.constants';
import { UploadFileJobDto } from '../dto/upload-file-job.dto';
import { UploadService } from '../upload.service';
import { ArweaveUploader } from '../utils/ArweaveUploader.util';
import { FeeProducer } from './fee.producer';


@Processor(UPLOAD_QUEUE)
export class UploadConsumer extends BaseConsumer {
    private readonly arweaveUploader: ArweaveUploader;

    constructor(
        logger: LoggerService,
        private readonly uploadService: UploadService,
        private readonly config: ConfigService,
        private readonly feeProducer: FeeProducer
    ) {
        super(logger);
        const jwk = JSON.parse(this.config.get('admin.arweaveJWK') as string);

        if (!jwk) throw new Error('Arweave JWK is not set');
        this.arweaveUploader = new ArweaveUploader(jwk);
    }

    async process(job: Job<UploadFileJobDto>) {
        const { file, requestId } = job.data
        const buffer = await readFile(file.path);
        const isSignedValidBundle = await ArweaveUploader.isSignedValidDataItemsInBundle(buffer);

        if (!isSignedValidBundle) {
            throw new BadRequestException('Data item is not signed or invalid');
        }

        const dataItems = ArweaveUploader.unpackBundle(buffer);

        await this.arweaveUploader.bundleAndUploadDataItems(dataItems);

        const txId = dataItems[0].id

        this.uploadService.updateUploadTxId(requestId, txId);
        this.uploadService.updateUploadStatus(requestId, UploadStatus.COMPLETED);
        this.uploadService.updateUploadReceiptStatus(requestId, ReceiptStatus.COMPLETED);

        await unlink(file.path);


        const feeRecord = await this.uploadService.createFeeTransaction(requestId)

        return {
            uploadId: requestId,
            feeRecordId: feeRecord.id
        };
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job) {
        const { uploadId, feeRecordId } = job.returnvalue;

        this.feeProducer.extractFee({
            uploadId,
            feeRecordId
        })
    }
}