import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';

import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const mockUser: User = {
    id: 1,
    walletAddress: '0x123',
    chainType: 'evm',
    nonce: null,
    domain: null,
    issuedAt: null,
    lastSignature: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockDatabaseService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserByWalletAddress', () => {
    it('should find a user by wallet address', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserByWalletAddress(mockUser.walletAddress);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: mockUser.walletAddress },
      });
    });

    it('should return null when user is not found', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      const result = await service.findUserByWalletAddress('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        walletAddress: '0x123',
        chainType: 'evm',
        nonce: '',
        domain: '',
        issuedAt: new Date(),
        lastSignature: ''
      };

      mockDatabaseService.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });
  });

  describe('setNonce', () => {
    it('should set nonce and issuedAt for a user', async () => {
      const nonce = 'test-nonce';
      const updatedUser = { ...mockUser, nonce, issuedAt: expect.any(Date) };

      mockDatabaseService.user.update.mockResolvedValue(updatedUser);

      const result = await service.setNonce(mockUser, nonce);

      expect(result).toEqual(updatedUser);
      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { nonce, issuedAt: expect.any(Date) },
      });
    });
  });

  describe('clearNonce', () => {
    it('should clear nonce for a user', async () => {
      const updatedUser = { ...mockUser, nonce: null };

      mockDatabaseService.user.update.mockResolvedValue(updatedUser);

      const result = await service.clearNonce(mockUser);

      expect(result).toEqual(updatedUser);
      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { nonce: null },
      });
    });
  });

  describe('setLastSignature', () => {
    it('should set last signature for a user', async () => {
      const signature = 'test-signature';
      const updatedUser = { ...mockUser, lastSignature: signature };

      mockDatabaseService.user.update.mockResolvedValue(updatedUser);

      const result = await service.setLastSignature(mockUser, signature);

      expect(result).toEqual(updatedUser);
      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastSignature: signature },
      });
    });
  });

  describe('clearLastSignature', () => {
    it('should clear last signature for a user', async () => {
      const updatedUser = { ...mockUser, lastSignature: null };

      mockDatabaseService.user.update.mockResolvedValue(updatedUser);

      const result = await service.clearLastSignature(mockUser);

      expect(result).toEqual(updatedUser);
      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastSignature: null },
      });
    });
  });
});
