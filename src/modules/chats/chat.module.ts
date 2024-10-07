import { Module } from '@nestjs/common';
import { ChatsController } from './chat.controller';
import { ChatsService } from './chat.services';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/utils/shcema/chat.schema/Chat.schema';


@Module({
    imports: [MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }])],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatModule {}
