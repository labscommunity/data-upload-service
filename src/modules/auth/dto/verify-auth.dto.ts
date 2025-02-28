import { ChainType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyAuthDto {
    @IsNotEmpty()
    @IsString()
    walletAddress: string;

    @IsNotEmpty()
    @IsEnum(ChainType)
    chainType: ChainType;

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
