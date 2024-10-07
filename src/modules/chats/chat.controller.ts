import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ChatsService } from './chat.services';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('send')
  sendMessage(
    @Body('from') from: string,
    @Body('to') to: string,
    @Body('message') message: string,
  ) {
    return this.chatsService.sendMessage(from, to, message);
  }

  @Get(':userId/:friendId')
  getMessages(@Param('userId') userId: string, @Param('friendId') friendId: string) {
    return this.chatsService.getMessages(userId, friendId);
  }
}
