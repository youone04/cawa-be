//v1

import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/utils/shcema/user.schema/User.schema';

@WebSocketGateway(8900, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Menggunakan Map untuk menampung user data
  private users: Map<string, string> = new Map(); // key: userId, value: socketId
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }


  handleConnection(_socket: Socket) {
    console.log('a user connected...');
  }

  handleDisconnect(socket: Socket) {
    console.log('a user disconnected!');
    this.removeUserBySocketId(socket.id);
    console.log('disconnect', this.users)
  }

  private getUserSocketId(userId: string): string | undefined {
    return this.users.get(userId);
  }

  private addUser(userId: string, socketId: string) {
    // Menambahkan user dengan userId sebagai key dan socketId sebagai value
    this.users.set(userId, socketId);
    console.log('userr connect', this.users)
    this.notifyFriendsOfOnlineUsers(userId);
  }

  private async notifyFriendsOfOnlineUsers(userId?: string) {
    console.log('userId offline/online', userId)
    if (!userId) return;
    const user = await this.userModel.findById(userId).populate('friends');
    //kunci, apakah onlin/offline
    const friendsOnOfflineline = Array.from(this.users.keys()).filter(friendId =>
      user.friends.includes(friendId),
    );

    this.server.to(this.getUserSocketId(userId)).emit('getFriendsOnline', friendsOnOfflineline);
    const emitPromises = user.friends.map(async (idFriends) => {
      const userFriends = await this.userModel.findById(idFriends).populate('friends');

      const friendsOnOfflineline2 = Array.from(this.users.keys()).filter(friendId =>
        userFriends.friends.includes(friendId),
      );
      console.log('friendsOnOfflineline2', friendsOnOfflineline2)
      return this.server.to(this.getUserSocketId(idFriends)).emit('getFriendsOnline', friendsOnOfflineline2)
    }

    );

    // Menggunakan Promise.all untuk menunggu semua emit selesai
    Promise.all(emitPromises)
      .then(() => {
        console.log('All friends online/offline notifications sent');
      })
      .catch(err => {
        console.error('Error sending notifications:', err);
      });

  }

  private removeUserBySocketId(socketId: string) {
    // Mencari userId berdasarkan socketId dan menghapusnya
    for (const [userId, sid] of this.users.entries()) {
      if (sid === socketId) {
        this.users.delete(userId);

        //kunci remove saat offline
        this.notifyFriendsOfOnlineUsers(userId);
        break;
      }
    }
  }


  @SubscribeMessage('addUser')
  handleAddUser(client: Socket, userId: string) {
    this.addUser(userId, client.id);
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    client: Socket,
    payload: { from: string; to: string; message: string; username:string },

  ) {
    console.log('payload', payload)
    const receiverSocketId = this.getUserSocketId(payload.to);
    if (receiverSocketId) {
      // Mengirim pesan hanya ke user dengan receiverId
      this.server.to(receiverSocketId).emit('getMessage', {
        from: payload.from, //senderId
        message: payload.message, //text
        to: payload.to,//receiverId
        username: payload.username,
        timestamp: Date.now(),
      });
    }
  }
}
