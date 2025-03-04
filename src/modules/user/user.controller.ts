import { Controller, Get, NotFoundException, Request, UnauthorizedException } from '@nestjs/common';

// import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  async getProfile(@Request() { user: { walletAddress } }: { user: { walletAddress: string } }) {
    const user = await this.userService.findUserByWalletAddress(walletAddress);

    return user;
  }

  @Get('ar-keys')
  async getArKeys(@Request() { user: { walletAddress } }: { user: { walletAddress: string } }) {
    const user = await this.userService.findUserByWalletAddress(walletAddress);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const arKeys = await this.userService.getArKeys(user);

    if (!arKeys) {
      throw new NotFoundException('User does not have AR keys');
    }

    return arKeys;
  }
}
