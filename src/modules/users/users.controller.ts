import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  createUser(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.usersService.createUser(username, email, password);
  }

  @Post('login')
  login(@Body('username') username: string, @Body('password') password: string) {
    return this.usersService.login(username, password);
  }

  @Post(':userId/friend-request/:targetUserId')
  sendFriendRequest(@Param('userId') userId: string, @Param('targetUserId') targetUserId: string) {
    return this.usersService.sendFriendRequest(userId, targetUserId);
  }

  @Post(':userId/accept-friend/:friendId')
  acceptFriendRequest(@Param('userId') userId: string, @Param('friendId') friendId: string) {
    return this.usersService.acceptFriendRequest(userId, friendId);
  }

  @Get(':userId/friends')
  getFriends(@Param('userId') userId: string) {
    // return this.usersService.getFriendsOnline(userId);
    return this.usersService.getFriends(userId);
  }

  @Get(':userId/friend-requests')
  getFriendRequests(@Param('userId') userId: string) {
    return this.usersService.getFriendRequests(userId);
  }

   @Get(':userId/sent-friend-requests')
  getSentFriendRequests(@Param('userId') userId: string) {
    return this.usersService.getSentFriendRequests(userId);
  }

  @Get(':userId/profile')
  getProfile(@Param('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get(':userId/pin/:pin')
  getUserByPin( @Param('userId') userId: string, @Param('pin') pin: string,) {
    return this.usersService.getUserByPin(userId, pin);
  }
}
