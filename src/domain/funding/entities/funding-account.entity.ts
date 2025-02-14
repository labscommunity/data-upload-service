export class FundingAccount {
  constructor(
    public readonly walletAddress: string,
    public balance: number, // store in base units or adapt for token decimals
    public readonly chain: string, // e.g. 'Base', 'Ethereum', 'Polygon', etc.
    public lastUpdated: Date = new Date(),
  ) {}
}
