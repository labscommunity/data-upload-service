export interface DepositRequestDto {
  walletAddress: string;
  amount: number;
  chain: string; // 'Base' | 'Ethereum' | 'Polygon' | etc.
}
