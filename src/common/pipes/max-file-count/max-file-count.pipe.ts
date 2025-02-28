import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MaxFileCountPipe implements PipeTransform {
  constructor(private readonly maxFileCount: number) {
    //
  }

  transform(files: Array<Express.Multer.File>) {
    if (files.length > this.maxFileCount) {
      throw new BadRequestException(`Maximum file count is ${this.maxFileCount}`);
    }

    return files;
  }
}
