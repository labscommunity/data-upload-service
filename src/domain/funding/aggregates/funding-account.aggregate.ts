import { FundingAccount } from "../entities/funding-account.entity";

/**
 * The FundingAccountAggregate encapsulates business logic
 * around a user's funding account, building on the base entity.
 */
export class FundingAccountAggregate {
  constructor(private fundingAccount: FundingAccount) {}

  public credit(amount: number): void {
    this.fundingAccount.balance += amount;
    // Additional domain rules or invariants if needed
  }

  public debit(amount: number): void {
    if (this.fundingAccount.balance < amount) {
      throw new Error("Insufficient balance");
    }
    this.fundingAccount.balance -= amount;
  }

  public getAccount(): FundingAccount {
    return this.fundingAccount;
  }
}
