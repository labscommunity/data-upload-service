import { UploadFileDto } from "./upload-file.dto";

export class UploadFileJobDto extends UploadFileDto {
    file: Express.Multer.File;
}