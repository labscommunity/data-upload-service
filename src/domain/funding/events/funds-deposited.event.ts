export class FundsDepositedEvent {
  constructor(
    public readonly walletAddress: string,
    public readonly amount: number,
    public readonly chain: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
