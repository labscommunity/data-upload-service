import { ChainType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

export class GenerateNonceDto implements Partial<CreateUserDto> {
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
}


