export interface UploadRequestDto {
  uploaderAddress: string;
  fileSize: number;
  signature: string; // EVM signature for authorization
  // Other optional fields: tags, encryption data, etc.
}
