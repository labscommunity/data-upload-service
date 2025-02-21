import { ChainType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { CreateUserInput } from '../user.types';

export class CreateUserDto implements CreateUserInput {
    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @IsEnum(ChainType)
    @IsNotEmpty()
    chainType: ChainType;

    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    chainId: number;

    @IsString()
    @IsOptional()
    nonce: string;

    @IsString()
    @IsOptional()
    domain: string;

    @IsDate()
    @IsOptional()
    issuedAt: Date;

    @IsString()
    @IsOptional()
    lastSignature: string;
}

