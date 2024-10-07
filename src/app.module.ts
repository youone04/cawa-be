import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/users/users.module';
import { ChatModule } from './modules/chats/chat.module';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [UserModule, ChatModule, MongooseModule.forRoot('mongodb+srv://yudigunaone87:GaREnwBBHJfni99Z@cluster0.covvx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
