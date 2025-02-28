import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Injectable()
export class TokenService {
  constructor(
    private readonly databaseService: DatabaseService
  ) { }

  create(createTokenDto: CreateTokenDto) {
    return this.databaseService.token.create({
      data: createTokenDto,
    });
  }

  findAll() {
    return this.databaseService.token.findMany();
  }

  findOne(id: string) {
    return this.databaseService.token.findUnique({
      where: { id },
    });
  }

  update(id: string, updateTokenDto: UpdateTokenDto) {
    return this.databaseService.token.update({
      where: { id },
      data: updateTokenDto,
    });
  }

  remove(id: string) {
    return this.databaseService.token.delete({
      where: { id },
    });
  }
}
