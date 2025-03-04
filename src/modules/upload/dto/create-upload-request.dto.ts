import { Network, TokenTicker, UploadType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { ValidateNested } from 'src/common/decorators/validate-nested/validate-nested.decorator';

import { TagDto } from './tag.dto';

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

    @IsArray()
    @IsNotEmpty()
    @IsOptional()
    @Type(() => TagDto)
    @ValidateNested(TagDto, { each: true, message: 'Tag is not valid' })
    @Transform(({ value }) => {
        return JSON.parse(value) as TagDto[];
    })
    tags: TagDto[];
}
