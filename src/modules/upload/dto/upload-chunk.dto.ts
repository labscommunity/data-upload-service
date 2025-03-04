import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UploadChunkDto {
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  currentChunk: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  totalChunks: number;
}
