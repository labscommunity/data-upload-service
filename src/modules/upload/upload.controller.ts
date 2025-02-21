import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Auth } from 'src/core/auth/decorators/auth.decorator';
import { AuthType } from 'src/core/auth/enums/auth-type.enum';

import { EstimatesDto } from './dto/estimates.dto';
import { UploadService } from './upload.service';
@Auth(AuthType.Bearer)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('cost')
  getEstimate(@Body() body: EstimatesDto) {
    return this.uploadService.getCostEstimate(body);
  }
}
