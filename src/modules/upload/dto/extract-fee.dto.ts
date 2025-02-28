import { IsNotEmpty, IsString } from "class-validator";

export class ExtractFeeDto {
    @IsString()
    @IsNotEmpty()
    uploadId: string;

    @IsString()
    @IsNotEmpty()
    feeRecordId: string;
}