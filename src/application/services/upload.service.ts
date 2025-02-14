import { v4 as uuid } from "uuid";

import { FundingAccountAggregate } from "../../domain/funding/aggregates/funding-account.aggregate";
import { IFundingAccountRepository } from "../../domain/funding/repositories/funding-account.repository";
import { UploadService } from "../../domain/upload/services/upload.service";
import { UploadRequestDto } from "../dtos/upload-request.dto";

/**
 * UploadApplicationService orchestrates verifying funds,
 * deducting costs, and then calling domain service to record the upload.
 */
export class UploadApplicationService {
  constructor(
    private uploadService: UploadService,
    private fundingAccountRepo: IFundingAccountRepository,
    private arweaveBaseCostPerByte: number, // hypothetical cost
    private serviceFeePercent: number,
  ) {}

  public async requestUpload(
    dto: UploadRequestDto,
  ): Promise<{ uploadId: string }> {
    // 1. Verify user's signature -> omitted for brevity
    // 2. Calculate cost
    const fileCost = dto.fileSize * this.arweaveBaseCostPerByte;
    const serviceFee = fileCost * this.serviceFeePercent;
    const totalCost = fileCost + serviceFee;

    // 3. Check funding balance
    const account = await this.fundingAccountRepo.findByWalletAddress(
      dto.uploaderAddress,
    );
    if (!account) {
      throw new Error("Funding account not found");
    }

    const agg = new FundingAccountAggregate(account);
    agg.debit(totalCost);
    await this.fundingAccountRepo.save(agg.getAccount());

    // 4. Create pending upload record in domain
    const uploadId = uuid();
    await this.uploadService.createPendingUpload(
      uploadId,
      dto.uploaderAddress,
      dto.fileSize,
      totalCost,
    );

    return { uploadId };
  }

  /**
   * Called once the node actually uploads to Arweave and receives a Tx ID
   */
  public async completeUpload(
    uploadId: string,
    arweaveTxId: string,
  ): Promise<void> {
    await this.uploadService.markUploadCompleted(uploadId, arweaveTxId);
  }
}
