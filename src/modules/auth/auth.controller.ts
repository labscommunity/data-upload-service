import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) { }

  @Post('nonce')
  async generateNonce(
    @Body() createUserDto: CreateUserDto,
  ) {
    let user = await this.userService.findUserByWalletAddress(createUserDto.walletAddress);

    if (!user) {
      user = await this.userService.createUser(createUserDto);
    }

    return this.authService.generateNonce(user);
  }

  @Post('verify')
  async verifySignature(
    @Body() verifyAuthDto: VerifyAuthDto,
  ) {
    const user = await this.userService.findUserByWalletAddress(verifyAuthDto.walletAddress);
    if (!user || !user.nonce) {
      throw new BadRequestException('User not found or nonce is not set');
    }

    await this.authService.verifySignature(verifyAuthDto, user);

    const tokens = await this.authService.issueTokens(user);
    return tokens;
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshToken: string) {
    const tokens = await this.authService.refreshTokens(refreshToken);
    return tokens;
  }
}
