import { Request, Response } from "express";

import { DepositRequestDto } from "../dtos/deposit-request.dto";
import { FundingApplicationService } from "../services/funding.service";

export class FundingController {
  constructor(private fundingAppService: FundingApplicationService) {}

  public deposit = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto: DepositRequestDto = req.body;
      await this.fundingAppService.deposit(dto);
      return res.status(200).json({ success: true });
    } catch (error: unknown) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
