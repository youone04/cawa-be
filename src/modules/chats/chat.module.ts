import { Module } from '@nestjs/common';
import { ChatsController } from './chat.controller';
import { ChatsService } from './chat.services';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/utils/shcema/chat.schema/Chat.schema';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../users/users.module';


@Module({
    imports: [MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]), UserModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateway],
})
export class ChatModule {}
