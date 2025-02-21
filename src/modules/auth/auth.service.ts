import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChainType, User } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import Arweave from 'arweave/node';
import * as crypto from 'crypto';
import { ethers } from 'ethers';
import * as nacl from 'tweetnacl';

import { UserService } from '../user/user.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@Injectable()
export class AuthService {
  private VERIFY_MAP = {
    [ChainType.evm]: this.verifyEvmSignature,
    [ChainType.solana]: this.verifySolanaSignature,
    [ChainType.arweave]: this.verifyArweaveSignature,
  }

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {

    // Bind verification methods to preserve 'this' context
    this.verifyEvmSignature = this.verifyEvmSignature.bind(this);
    this.verifySolanaSignature = this.verifySolanaSignature.bind(this);
    this.verifyArweaveSignature = this.verifyArweaveSignature.bind(this);

    this.VERIFY_MAP = {
      [ChainType.evm]: this.verifyEvmSignature,
      [ChainType.solana]: this.verifySolanaSignature,
      [ChainType.arweave]: this.verifyArweaveSignature,
    };
  }

  async generateNonce(user: User): Promise<string> {
    const nonce = crypto.randomBytes(16).toString('hex');
    await this.userService.setNonce(user, nonce);

    return nonce;
  }

  async verifySignature(verifyAuthDto: VerifyAuthDto, user: User) {
    const { chainType, signedMessage, signature } = verifyAuthDto;

    const verifyFn = this.VERIFY_MAP[chainType];
    if (!verifyFn) {
      throw new BadRequestException('Invalid chain type');
    }

    await verifyFn(user, signedMessage, signature, verifyAuthDto.publicKey);

    await this.userService.clearNonce(user);
    await this.userService.setLastSignature(user, signature);
  }

  async issueTokens(user: User): Promise<{ accessToken: string, refreshToken: string }> {
    const payload = { walletAddress: user.walletAddress, id: user.id, chainType: user.chainType, role: user.role, chainId: user.chainId };

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, 3600 * 15, payload),
      this.signToken(user.id, 3600 * 24 * 7, payload),
    ])


    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(refreshToken: string): Promise<User> {
    console.log('refreshToken', refreshToken);
    const token = await this.jwtService.verifyAsync(refreshToken);
    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findUserByWalletAddress(token.walletAddress);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    const user = await this.verifyRefreshToken(refreshToken);

    return this.issueTokens(user);
  }

  async toArweaveAddress(publicKey: string): Promise<string> {
    try {
      const address = this.getArweave().wallets.jwkToAddress({
        kty: 'RSA',
        e: 'AQAB',
        n: publicKey,
      })

      return address;
    } catch (error) {
      throw new BadRequestException('Invalid Arweave public key');
    }
  }

  /**
 * EVM signature verification using EIP-191
 */
  private async verifyEvmSignature(user: User, signedMessage: string, signature: string) {
    // 1) Recover the address from the signature
    const recoveredAddr = ethers.verifyMessage(signedMessage, signature);

    // 2) Compare to the stored address (case-insensitive check)
    if (recoveredAddr.toLowerCase() !== user.walletAddress.toLowerCase()) {
      throw new BadRequestException('Invalid EVM signature: recovered address mismatch');
    }

    // 3) Check that the message includes the correct nonce
    const nonce = this.extractNonce(signedMessage);

    if (!nonce || nonce !== user.nonce) {
      throw new BadRequestException('Invalid EVM signature: nonce missing or mismatch');
    }
  }

  /**
 * Solana signature verification
 */
  private async verifySolanaSignature(user: User, signedMessage: string, signature: string) {
    // 1) Convert the base58 or base64 signature to a Uint8Array
    const signatureUint8 = Uint8Array.from(Buffer.from(signature, 'base64')); // or 'base58' if client returns that
    // 2) The public key
    const pubKey = new PublicKey(user.walletAddress);

    // 3) Check that the message includes the correct nonce
    const nonce = this.extractNonce(signedMessage);

    if (!nonce || nonce !== user.nonce) {
      throw new BadRequestException('Invalid Solana signature: nonce missing or mismatch');
    }

    // 4) Verify with nacl
    const messageUint8 = new TextEncoder().encode(signedMessage);
    const verified = nacl.sign.detached.verify(messageUint8, signatureUint8, pubKey.toBytes());

    if (!verified) {
      throw new BadRequestException('Invalid Solana signature: verification failed');
    }
  }

  /**
 * Arweave signature verification
 */
  private async verifyArweaveSignature(user: User, signedMessage: string, signature: string, publicKey?: string) {
    if (!publicKey) {
      throw new BadRequestException('Invalid Arweave public key');
    }

    const nonce = this.extractNonce(signedMessage);
    if (!nonce || nonce !== user.nonce) {
      throw new BadRequestException('Invalid Arweave signature: nonce missing or mismatch');
    }

    const verified = this.getArweave().crypto.verify(publicKey, Uint8Array.from(Buffer.from(signedMessage)), Uint8Array.from(Buffer.from(signature)));

    if (!verified) {
      throw new BadRequestException('Invalid Arweave signature: verification failed');
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        expiresIn,
        ...payload,
      },
    );
  }


  private extractNonce(signedMessage: string): string | null {
    const regex = /Nonce:\s*([^\n]+)/i;
    const match = signedMessage.match(regex);

    return match ? match[1].trim() : null;
  }

  private getArweave() {
    return Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });
  }
}
