import { EventType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateLogDto {
    @IsEnum(EventType)
    @IsNotEmpty()
    eventType: EventType;

    @IsString()
    @IsOptional()
    message?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
