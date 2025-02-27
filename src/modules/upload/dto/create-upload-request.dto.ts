import { Network, TokenTicker, UploadType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString
} from 'class-validator';

export class CreateUploadRequestDto {
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @IsString()
    @IsNotEmpty()
    mimeType: string;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    totalChunks: number;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    size: number;

    @IsEnum(UploadType)
    @IsNotEmpty()
    uploadType: UploadType;

    @IsEnum(TokenTicker)
    @IsNotEmpty()
    tokenTicker: TokenTicker;

    @IsEnum(Network)
    @IsOptional()
    @IsNotEmpty()
    network: Network;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    chainId: number;
}
