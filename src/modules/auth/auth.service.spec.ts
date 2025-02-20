import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ChainType, User } from '@prisma/client';
import * as crypto from 'crypto';
import { mockDeep } from 'jest-mock-extended';
import * as nacl from 'tweetnacl';

import { DatabaseService } from '../../database/database.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

// Mock Arweave
jest.mock('arweave/node', () => {
  return {
    default: {
      init: jest.fn().mockReturnValue({
        crypto: {
          verify: jest.fn()
        },
        wallets: {
          jwkToAddress: jest.fn()
        }
      })
    }
  };
});

// Mock Solana PublicKey
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation(() => ({
    toBytes: () => new Uint8Array(32).fill(1), // Mock 32-byte public key
  })),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: DeepMocked<UserService>;
  let jwtService: DeepMocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDeep<DatabaseService>()
        },
        {
          provide: UserService,
          useValue: createMock<UserService>()
        },
        {
          provide: JwtService,
          useValue: createMock<JwtService>()
        }
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('generateNonce', () => {
    it('should generate and set a nonce for a user', async () => {
      // Arrange
      const user = createMock<User>();
      const mockNonce = '1234567890abcdef';
      // Mock crypto.randomBytes
      jest.spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from(mockNonce, 'hex'));

      userService.setNonce.mockResolvedValue(user);

      // Act
      const result = await authService.generateNonce(user);

      // Assert
      expect(result).toBe(mockNonce);
      expect(userService.setNonce).toHaveBeenCalledWith(user, mockNonce);
    });
  });

  describe('verifySignature', () => {
    it('should verify the signature of a user', async () => {
      const user = createMock<User>({
        nonce: 'test-nonce',
        walletAddress: 'mock-solana-address'
      });

      const signedMessage = 'Test message with Nonce: test-nonce';
      const mockSignature = new Uint8Array(64).fill(1); // Mock 64-byte signature

      const verifyAuthDto = {
        walletAddress: user.walletAddress,
        chainType: ChainType.solana,
        signedMessage,
        signature: Buffer.from(mockSignature).toString('base64'),
        publicKey: 'mock-public-key'
      };

      // Mock nacl verify to return true
      jest.spyOn(nacl.sign.detached, 'verify').mockImplementation(() => true);

      await authService.verifySignature(verifyAuthDto, user);

      expect(userService.clearNonce).toHaveBeenCalledWith(user);
      expect(userService.setLastSignature).toHaveBeenCalledWith(user, verifyAuthDto.signature);
    });
    it('should throw BadRequestException if the chain type is invalid', async () => {
      const user = createMock<User>({
        nonce: 'test-nonce',
        walletAddress: 'mock-solana-address'
      });

      const signedMessage = 'Test message with Nonce: test-nonce';
      const mockSignature = new Uint8Array(64).fill(1); // Mock 64-byte signature

      const verifyAuthDto = {
        walletAddress: user.walletAddress,
        chainType: 'invalid-chain-type' as ChainType,
        signedMessage,
        signature: Buffer.from(mockSignature).toString('base64'),
        publicKey: 'mock-public-key'
      };

      // Mock nacl verify to return true
      jest.spyOn(nacl.sign.detached, 'verify').mockImplementation(() => true);

      await expect(authService.verifySignature(verifyAuthDto, user)).rejects.toThrow(BadRequestException);

      expect(userService.clearNonce).not.toHaveBeenCalled();
      expect(userService.setLastSignature).not.toHaveBeenCalled();
    });
    it('should throw Error if the signature is invalid', async () => {
      const user = createMock<User>({
        nonce: 'test-nonce',
        walletAddress: 'mock-solana-address'
      });

      const signedMessage = 'Test message with Nonce: test-nonce';
      const mockSignature = new Uint8Array(64).fill(1); // Mock 64-byte signature

      const verifyAuthDto = {
        walletAddress: user.walletAddress,
        chainType: ChainType.solana,
        signedMessage,
        signature: Buffer.from(mockSignature).toString('base64'),
        publicKey: 'mock-public-key'
      };

      // Mock nacl verify to return true
      jest.spyOn(nacl.sign.detached, 'verify').mockImplementation(() => false);

      await expect(authService.verifySignature(verifyAuthDto, user)).rejects.toThrow(Error);

      expect(userService.clearNonce).not.toHaveBeenCalled();
      expect(userService.setLastSignature).not.toHaveBeenCalled();
    });
    it('should throw Error if the nonce doesnt match', async () => {
      const user = createMock<User>({
        nonce: 'test-nonce',
        walletAddress: 'mock-solana-address'
      });

      const signedMessage = 'Test message with Nonce: test-nonce-2';
      const mockSignature = new Uint8Array(64).fill(1); // Mock 64-byte signature

      const verifyAuthDto = {
        walletAddress: user.walletAddress,
        chainType: ChainType.solana,
        signedMessage,
        signature: Buffer.from(mockSignature).toString('base64'),
        publicKey: 'mock-public-key'
      };

      // Mock nacl verify to return true
      jest.spyOn(nacl.sign.detached, 'verify').mockImplementation(() => true);

      await expect(authService.verifySignature(verifyAuthDto, user)).rejects.toThrow(Error);

      expect(userService.clearNonce).not.toHaveBeenCalled();
      expect(userService.setLastSignature).not.toHaveBeenCalled();
    });
  });

  describe('issueTokens', () => {
    it('should issue access and refresh tokens for a user', async () => {
      const user = createMock<User>();
      const mockAccessToken = 'mock-token';
      const mockRefreshToken = 'mock-token';

      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockAccessToken);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockRefreshToken);

      const result = await authService.issueTokens(user);

      expect(result).toEqual({ accessToken: mockAccessToken, refreshToken: mockRefreshToken });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify the refresh token of a user', async () => {
      const user = createMock<User>({
        walletAddress: 'mock-wallet-address'
      });
      const mockRefreshToken = 'mock-token';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(user);
      jest.spyOn(userService, 'findUserByWalletAddress').mockResolvedValue(user);

      const result = await authService.verifyRefreshToken(mockRefreshToken);

      expect(result).toEqual(user);
    });
    it('should throw UnauthorizedException if the refresh token is invalid', async () => {
      const mockRefreshToken = 'mock-token';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(null as any);

      await expect(authService.verifyRefreshToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException if the user is not found', async () => {
      const user = createMock<User>({
        walletAddress: 'mock-wallet-address'
      });
      const mockRefreshToken = 'mock-token';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(user);
      jest.spyOn(userService, 'findUserByWalletAddress').mockResolvedValue(null);

      await expect(authService.verifyRefreshToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh the tokens of a user', async () => {
      const user = createMock<User>();
      const mockRefreshToken = 'mock-token';

      jest.spyOn(authService, 'verifyRefreshToken').mockResolvedValue(user);
      jest.spyOn(authService, 'issueTokens').mockResolvedValue({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });

      const result = await authService.refreshTokens(mockRefreshToken);

      expect(result).toEqual({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
    });
  });
});

