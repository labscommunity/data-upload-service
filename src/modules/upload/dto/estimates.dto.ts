import { ChainType, Network, TokenTicker } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, Min } from "class-validator";


export class EstimatesDto {
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    @Type(() => Number)
    size: number;

    @IsEnum(TokenTicker)
    @IsNotEmpty()
    tokenTicker: TokenTicker;

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
