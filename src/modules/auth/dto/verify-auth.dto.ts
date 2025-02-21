import { ChainType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyAuthDto {
    @IsNotEmpty()
    @IsString()
    walletAddress: string;

    @IsNotEmpty()
    @IsEnum(ChainType)
    chainType: ChainType;

    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    chainId: number;

    @IsNotEmpty()
    @IsString()
    signedMessage: string;

    @IsNotEmpty()
    @IsString()
    signature: string;

    @IsOptional()
    @IsString()
    publicKey?: string;
}
