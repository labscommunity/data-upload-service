import { Transform, Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, Matches, } from "class-validator";
import { ValidateNested } from "src/common/decorators/validate-nested/validate-nested.decorator";

import { TagDto } from "./tag.dto";

export class UploadFileDto {
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsOptional()
    @Matches(/\.[^.]+$/, {
        message: 'fileName must have a file extension',
    })
    fileName: string;

    @IsString()
    @IsOptional()
    @Matches(/^[a-zA-Z0-9\-_+.]+\/[a-zA-Z0-9\-_+.]+$/, {
        message: 'mimeType must be a valid MIME type',
    })
    mimeType: string; // TODO: Add enum

    @IsArray()
    @IsNotEmpty()
    @IsOptional()
    @Type(() => TagDto)
    @ValidateNested(TagDto, { each: true, message: 'Tag is not valid' })
    @Transform(({ value }) => {
        return JSON.parse(value) as TagDto[];
    })
    tags: TagDto[];

    @IsString()
    @IsNotEmpty()
    requestId: string;
}