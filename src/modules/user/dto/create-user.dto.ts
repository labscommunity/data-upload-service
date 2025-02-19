import { ChainType } from '@prisma/client';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { CreateUserInput } from '../user.types';

export class CreateUserDto implements CreateUserInput {
    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @IsEnum(ChainType)
    @IsNotEmpty()
    chainType: ChainType;

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

