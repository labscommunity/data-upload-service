import { FundingAccount } from "../../domain/funding/entities/funding-account.entity";
import { IFundingAccountRepository } from "../../domain/funding/repositories/funding-account.repository";
import { db } from "../database/sqlite-connection";

export class FundingAccountSqliteRepository
  implements IFundingAccountRepository
{
  public async findByWalletAddress(
    walletAddress: string,
  ): Promise<FundingAccount | null> {
    const row = await db.get(
      `
      SELECT * FROM funding_accounts WHERE walletAddress = ?
    `,
      [walletAddress],
    );

    if (!row) return null;
    return new FundingAccount(
      row.walletAddress,
      row.balance,
      row.chain,
      new Date(row.lastUpdated),
    );
  }

  public async create(entity: FundingAccount): Promise<void> {
    await db.run(
      `
      INSERT INTO funding_accounts (walletAddress, balance, chain, lastUpdated)
      VALUES (?, ?, ?, ?)
    `,
      [
        entity.walletAddress,
        entity.balance,
        entity.chain,
        entity.lastUpdated.toISOString(),
      ],
    );
  }

  public async save(entity: FundingAccount): Promise<void> {
    entity.lastUpdated = new Date();
    await db.run(
      `
      UPDATE funding_accounts 
      SET balance = ?, chain = ?, lastUpdated = ?
      WHERE walletAddress = ?
    `,
      [
        entity.balance,
        entity.chain,
        entity.lastUpdated.toISOString(),
        entity.walletAddress,
      ],
    );
  }
}
