export class Upload {
  constructor(
    public id: string, // internal ID (UUID)
    public uploaderAddress: string, // the wallet address
    public fileSize: number,
    public feeCharged: number, // total cost
    public arweaveTxId?: string, // assigned once uploaded
    public completedAt?: Date,
    public createdAt: Date = new Date(),
  ) {}
}
