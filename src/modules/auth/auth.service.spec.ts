import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { DatabaseService } from '../../database/database.service';
import { AuthService } from './auth.service';

describe.only('AuthService', () => {
  let authService: AuthService;
  let databaseService: DeepMockProxy<DatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, {
        provide: DatabaseService,
        useValue: mockDeep<DatabaseService>()
      }],
    }).useMocker(createMock).compile();

    authService = module.get<AuthService>(AuthService);
    databaseService = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('nonce', () => {
    it('should return a nonce', () => {
      // Arrange
      const user = createMock<User>();
      console.log(user);
      // const walletAddress = '0x1234567890';
      // const nonce = authService.getNonce(walletAddress);
      // expect(nonce).toBeDefined();
    });
  });
});
