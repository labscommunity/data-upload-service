import { Upload } from "../entities/upload.entity";

export interface IUploadRepository {
  findById(uploadId: string): Promise<Upload | null>;
  create(upload: Upload): Promise<void>;
  save(upload: Upload): Promise<void>;
}
