/**
 * Example Value Object for token amounts (not fully used above).
 * Could enforce invariants, handle decimals, etc.
 */
export class TokenAmount {
  constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new Error("Token amount cannot be negative");
    }
  }

  public get value(): number {
    return this.amount;
  }
}
