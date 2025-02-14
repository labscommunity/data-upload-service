import { UploadAggregate } from "../aggregates/upload.aggregate";
import { Upload } from "../entities/upload.entity";
import { UploadCompletedEvent } from "../events/upload-completed.event";
import { IUploadRepository } from "../repositories/upload.repository";

/**
 * UploadService handles domain logic for finalizing
 * an upload to Arweave (once funds are verified).
 */
export class UploadService {
  constructor(private uploadRepo: IUploadRepository) {}

  public async createPendingUpload(
    uploadId: string,
    uploaderAddress: string,
    fileSize: number,
    feeCharged: number,
  ): Promise<Upload> {
    const upload = new Upload(uploadId, uploaderAddress, fileSize, feeCharged);
    await this.uploadRepo.create(upload);
    return upload;
  }

  public async markUploadCompleted(
    uploadId: string,
    arweaveTxId: string,
  ): Promise<UploadCompletedEvent> {
    const upload = await this.uploadRepo.findById(uploadId);
    if (!upload) {
      throw new Error("Upload not found");
    }

    const agg = new UploadAggregate(upload);
    agg.markCompleted(arweaveTxId);
    await this.uploadRepo.save(agg.getUpload());

    return new UploadCompletedEvent(
      upload.uploaderAddress,
      arweaveTxId,
      upload.id,
      upload.feeCharged || 0,
    );
  }
}
