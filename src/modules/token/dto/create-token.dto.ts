import { ChainType, Network, TokenTicker } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { CreateTokenInput } from '../token.types';

export class CreateTokenDto implements CreateTokenInput {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(TokenTicker)
    @IsNotEmpty()
    ticker: TokenTicker;

    @IsNumber()
    @IsNotEmpty()
    decimals: number;

    @IsEnum(ChainType)
    @IsNotEmpty()
    chainType: ChainType;

    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    chainId: number;

    @IsEnum(Network)
    @IsNotEmpty()
    network: Network;
}
