import { Upload } from "../../domain/upload/entities/upload.entity";
import { IUploadRepository } from "../../domain/upload/repositories/upload.repository";
import { db } from "../database/sqlite-connection";

export class UploadSqliteRepository implements IUploadRepository {
  public async findById(uploadId: string): Promise<Upload | null> {
    const row = await db.get(
      `
      SELECT * FROM uploads WHERE id = ?
    `,
      [uploadId],
    );

    if (!row) return null;
    return new Upload(
      row.id,
      row.uploaderAddress,
      row.fileSize,
      row.feeCharged,
      row.arweaveTxId || undefined,
      row.completedAt ? new Date(row.completedAt) : undefined,
      new Date(row.createdAt),
    );
  }

  public async create(upload: Upload): Promise<void> {
    await db.run(
      `
      INSERT INTO uploads (id, uploaderAddress, fileSize, feeCharged, arweaveTxId, completedAt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        upload.id,
        upload.uploaderAddress,
        upload.fileSize,
        upload.feeCharged,
        upload.arweaveTxId || null,
        upload.completedAt ? upload.completedAt.toISOString() : null,
        upload.createdAt.toISOString(),
      ],
    );
  }

  public async save(upload: Upload): Promise<void> {
    await db.run(
      `
      UPDATE uploads
      SET uploaderAddress = ?, 
          fileSize = ?, 
          feeCharged = ?, 
          arweaveTxId = ?, 
          completedAt = ?, 
          createdAt = ?
      WHERE id = ?
    `,
      [
        upload.uploaderAddress,
        upload.fileSize,
        upload.feeCharged,
        upload.arweaveTxId || null,
        upload.completedAt ? upload.completedAt.toISOString() : null,
        upload.createdAt.toISOString(),
        upload.id,
      ],
    );
  }
}
