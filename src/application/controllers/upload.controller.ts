import { Request, Response } from "express";

import { UploadRequestDto } from "../dtos/upload-request.dto";
import { UploadApplicationService } from "../services/upload.service";

export class UploadController {
  constructor(private uploadAppService: UploadApplicationService) {}

  public requestUpload = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const dto: UploadRequestDto = req.body;
      const { uploadId } = await this.uploadAppService.requestUpload(dto);
      return res.status(200).json({ uploadId });
    } catch (error: unknown) {
      return res
        .status(400)
        .json({ error: error instanceof Error ? error.message : error });
    }
  };

  public completeUpload = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const { uploadId, arweaveTxId } = req.body;
      await this.uploadAppService.completeUpload(uploadId, arweaveTxId);
      return res.status(200).json({ success: true });
    } catch (error: unknown) {
      return res
        .status(400)
        .json({ error: error instanceof Error ? error.message : error });
    }
  };
}
