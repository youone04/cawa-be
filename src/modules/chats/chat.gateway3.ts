//v3
import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { User } from 'src/utils/shcema/user.schema/User.schema';
  
  @WebSocketGateway(8900, {
    cors: {
      origin: '*',
    },
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    private users: Map<string, string> = new Map(); // key: userId, value: socketId
  
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  
    handleConnection(_socket: Socket) {
      console.log('a user connected...');
    }
  
    handleDisconnect(socket: Socket) {
      console.log('a user disconnected!');
      this.removeUserBySocketId(socket.id);
      this.notifyFriendsOfOnlineUsers();
    }
  
    private addUser(userId: string, socketId: string) {
      this.users.set(userId, socketId);
      this.notifyFriendsOfOnlineUsers(userId);
    }
  
    private removeUserBySocketId(socketId: string) {
      for (const [userId, sid] of this.users.entries()) {
        if (sid === socketId) {
          this.users.delete(userId);
          break;
        }
      }
      console.log(this.users);
    }
  
    private getUserSocketId(userId: string): string | undefined {
      return this.users.get(userId);
    }
  
    private async notifyFriendsOfOnlineUsers(userId?: string) {
      if (!userId) return;
  
      const user = await this.userModel.findById(userId).populate('friends');
      const friendsOnline = Array.from(this.users.keys()).filter(friendId =>
        user.friends.includes(friendId),
      );
  
      this.server.to(this.getUserSocketId(userId)).emit('getFriendsOnline', friendsOnline);
    }
  
    @SubscribeMessage('addUser')
    async handleAddUser(client: Socket, userId: string) {
      this.addUser(userId, client.id);
      console.log(this.users);
    }
  
    @SubscribeMessage('sendMessage')
    handleSendMessage(client: Socket, payload: { senderId: string; receiverId: string; text: string }) {
      console.log('payload', payload);
      const receiverSocketId = this.getUserSocketId(payload.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('getMessage', {
          senderId: payload.senderId,
          text: payload.text,
        });
      }
    }
  }