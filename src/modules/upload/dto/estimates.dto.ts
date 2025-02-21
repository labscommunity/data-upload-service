import { Type } from 'class-transformer';
import { IsInt, Min } from "class-validator";

export class EstimatesDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    size: number;
}
