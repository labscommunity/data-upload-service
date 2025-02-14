export class UploadCompletedEvent {
  constructor(
    public readonly uploaderAddress: string,
    public readonly arweaveTxId: string,
    public readonly uploadId: string,
    public readonly feeCharged: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
