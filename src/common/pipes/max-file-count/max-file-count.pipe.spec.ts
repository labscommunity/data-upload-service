import { BadRequestException } from '@nestjs/common';

import { MaxFileCountPipe } from './max-file-count.pipe';

describe('MaxFileCountPipe', () => {
  let pipe: MaxFileCountPipe;

  beforeEach(() => {
    pipe = new MaxFileCountPipe(2);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw an error if the file count is greater than the max file count', () => {
    const file = {} as Express.Multer.File;
    const files = [file, file, file] as Array<Express.Multer.File>;

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
  });

  it('should return the files if the file count is less than the max file count', () => {
    const file = {} as Express.Multer.File;
    const files = [file, file] as Array<Express.Multer.File>;

    expect(pipe.transform(files)).toEqual(files);
  });
});
