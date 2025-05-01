import {
  makeSignDoc as makeSignDocAmino,
  serializeSignDoc,
} from '@cosmjs/amino';
import { Secp256k1, Secp256k1Signature } from '@cosmjs/crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { sha256 } from "@noble/hashes/sha2"
import { ChainType, User } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import Arweave from 'arweave/node';
import * as crypto from 'crypto';
import { decodeBase64, ethers, } from 'ethers';
import * as nacl from 'tweetnacl';

import { UserService } from '../user/user.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
@Injectable()
export class AuthService {
  private VERIFY_MAP = {
    [ChainType.evm]: this.verifyEvmSignature,
    [ChainType.solana]: this.verifySolanaSignature,
    [ChainType.arweave]: this.verifyArweaveSignature,
    [ChainType.cosmos]: this.cosmosVerifySignature,
  }

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {

    // Bind verification methods to preserve 'this' context
    this.verifyEvmSignature = this.verifyEvmSignature.bind(this);
    this.verifySolanaSignature = this.verifySolanaSignature.bind(this);
    this.verifyArweaveSignature = this.verifyArweaveSignature.bind(this);
    this.cosmosVerifySignature = this.cosmosVerifySignature.bind(this);

    this.VERIFY_MAP = {
      [ChainType.evm]: this.verifyEvmSignature,
      [ChainType.solana]: this.verifySolanaSignature,
      [ChainType.arweave]: this.verifyArweaveSignature,
      [ChainType.cosmos]: this.cosmosVerifySignature,
    }
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
    const payload = { walletAddress: user.walletAddress, id: user.id, chainType: user.chainType, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, 3600 * 15, payload),
      this.signToken(user.id, 3600 * 24 * 7, payload),
    ])

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(refreshToken: string): Promise<User> {

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

  async generateArKeys() {
    const arweaveClient = this.getArweave();
    const jwk = await arweaveClient.wallets.generate();
    const address = await this.toArweaveAddress(jwk.n);

    return { jwk, address, publicKey: jwk.n };
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

    const publicJWK = {
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: publicKey
    };

    const verificationKey = await crypto.subtle.importKey(
      "jwk",
      publicJWK,
      {
        name: "RSA-PSS",
        hash: "SHA-256"
      },
      false,
      ["verify"]
    );

    const hash = await crypto.subtle.digest("SHA-256", Buffer.from(signedMessage));
    const isValidSignature = await crypto.subtle.verify(
      { name: "RSA-PSS", saltLength: 32 },
      verificationKey,
      Buffer.from(signature, 'base64'),
      hash
    );

    if (!isValidSignature) {
      throw new BadRequestException('Invalid Arweave signature: verification failed');
    }
  }

  /**
* Arweave signature verification
*/
  private async cosmosVerifySignature(user: User, signedMessage: string, signature: string, publicKey?: string) {
    if (!publicKey) {
      throw new BadRequestException('Invalid Cosmos public key');
    }

    const nonce = this.extractNonce(signedMessage);
    if (!nonce || nonce !== user.nonce) {
      throw new BadRequestException('Invalid Cosmos signature: nonce missing or mismatch');
    }

    const fixed = decodeBase64(signature);
    const cSig = Secp256k1Signature.fromFixedLength(fixed);
    const ADR36 = {
      type: 'sign/MsgSignData',
      memo: '',
      accountNumber: 0,
      sequence: 0,
      chainId: '',
      fee: { gas: '0', amount: [] },
    };
    const msgs = [{ type: ADR36.type, value: { signer: user.walletAddress, data: signedMessage } }];
    const signBytes = serializeSignDoc(
      makeSignDocAmino(
        msgs,
        ADR36.fee,
        ADR36.chainId,
        ADR36.memo,
        ADR36.accountNumber,
        ADR36.sequence,
      ),
    );
    const hash = sha256(signBytes)
    console.log({ hash, length: hash.length });
    const pkbytes = decodeBase64(publicKey);
    const ok = await Secp256k1.verifySignature(cSig, hash, pkbytes);
    if (!ok) {
      throw new BadRequestException('Invalid Cosmos signature: verification failed');
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      { sub: userId, ...payload },
      { expiresIn }
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
