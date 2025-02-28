import { PartialType } from '@nestjs/mapped-types';

import { UploadFileDto } from './upload-file.dto';

export class UpdateUploadDto extends PartialType(UploadFileDto) { }
