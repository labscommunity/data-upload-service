import { DepositService } from "../../domain/funding/services/deposit.service";
import { DepositRequestDto } from "../dtos/deposit-request.dto";

/**
 * FundingApplicationService glues the domain deposit logic
 * with external application concerns.
 */
export class FundingApplicationService {
  constructor(private depositService: DepositService) {}

  public async deposit(dto: DepositRequestDto): Promise<void> {
    // Optionally handle signature checks or other application-level logic
    await this.depositService.depositFunds(
      dto.walletAddress,
      dto.amount,
      dto.chain,
    );
  }
}
