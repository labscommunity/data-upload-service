import { FundingAccountAggregate } from "../aggregates/funding-account.aggregate";
import { FundingAccount } from "../entities/funding-account.entity";
import { FundsDepositedEvent } from "../events/funds-deposited.event";
import { IFundingAccountRepository } from "../repositories/funding-account.repository";

export class DepositService {
  constructor(private fundingAccountRepo: IFundingAccountRepository) {}

  public async depositFunds(
    walletAddress: string,
    amount: number,
    chain: string,
  ): Promise<FundsDepositedEvent> {
    let account =
      await this.fundingAccountRepo.findByWalletAddress(walletAddress);

    if (!account) {
      // Create a new account record if none exists
      account = new FundingAccount(walletAddress, 0, chain);
      await this.fundingAccountRepo.create(account);
    }

    const agg = new FundingAccountAggregate(account);
    agg.credit(amount);
    await this.fundingAccountRepo.save(agg.getAccount());

    return new FundsDepositedEvent(walletAddress, amount, chain, new Date());
  }
}
