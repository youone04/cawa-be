import { Module } from '@nestjs/common';
import { ChatsController } from './chat.controller';
import { ChatsService } from './chat.services';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/utils/shcema/chat.schema/Chat.schema';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../users/users.module';
import { User, UserSchema } from 'src/utils/shcema/user.schema/User.schema';


@Module({
    imports: [
      MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]), 
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), 
    UserModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateway],
})
export class ChatModule {}
