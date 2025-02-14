import { Upload } from "../entities/upload.entity";

export class UploadAggregate {
  constructor(private upload: Upload) {}

  public markCompleted(arweaveTxId: string): void {
    this.upload.arweaveTxId = arweaveTxId;
    this.upload.completedAt = new Date();
  }

  public getUpload(): Upload {
    return this.upload;
  }
}
