import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req: Request) {
    // Assume req.user is set by the JWT guard (e.g., contains walletAddress)
    // const user = await this.userService.findUserByWalletAddress(req.user.walletAddress);
    // return user;
  }

  // @Patch(':walletAddress')
  // @UseGuards(AuthGuard('jwt'))
  // update(@Param('walletAddress') walletAddress: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(walletAddress, updateUserDto);
  // }
}
