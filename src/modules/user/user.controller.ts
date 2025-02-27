import { Controller, Get, Request } from '@nestjs/common';

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
}
