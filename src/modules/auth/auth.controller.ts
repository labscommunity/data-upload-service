import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import { Auth } from '../../core/auth/decorators/auth.decorator';
import { AuthType } from '../../core/auth/enums/auth-type.enum';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { GenerateNonceDto } from './dto/generate-nonce.dto';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) { }

  @Auth(AuthType.None)
  @Post('nonce')
  async generateNonce(
    @Body() generateNonceDto: GenerateNonceDto,
  ) {
    console.log('generateNonceDto', generateNonceDto);
    let user = await this.userService.findUserByWalletAddress(generateNonceDto.walletAddress);

    if (!user) {
      user = await this.userService.createUser(generateNonceDto as CreateUserDto);
    }

    return this.authService.generateNonce(user);
  }

  @Auth(AuthType.None)
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

  @Auth(AuthType.Bearer)
  @Post('refresh')
  async refreshTokens(@Body() { refreshToken }: { refreshToken: string }) {
    const tokens = await this.authService.refreshTokens(refreshToken);
    return tokens;
  }
}
