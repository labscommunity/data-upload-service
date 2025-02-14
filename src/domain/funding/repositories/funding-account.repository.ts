import { FundingAccount } from "../entities/funding-account.entity";

export interface IFundingAccountRepository {
  findByWalletAddress(walletAddress: string): Promise<FundingAccount | null>;
  save(entity: FundingAccount): Promise<void>;
  create(entity: FundingAccount): Promise<void>;
}
