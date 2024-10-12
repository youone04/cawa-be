//1

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

  // @SubscribeMessage('disconnectMod')
  // async handleModDisconnect(_, userId: string) {
  //   console.log('userId disconnectMod', userId)
  //   const user = await this.userModel.findById(userId).populate('friends');
  //   const friendsOnline = Array.from(this.users.keys()).filter(friendId =>
  //     user.friends.includes(friendId),
  //   );

  //   friendsOnline.forEach(idFriends => {
  //     const friendsOnline3 = Array.from(this.users.keys()).filter(friendId =>
  //       friendId === userId
  //     );
  //     console.log('friendsOnline3', friendsOnline3)
  //     this.server.to(this.getUserSocketId(idFriends)).emit('getFriendsOnline', friendsOnline3);
  //   })
  // }

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
    // const friendsOnline2 = Array.from(this.users.keys()).filter(friendId => friendId === userId);
    // console.log('user.friends',user.friends)

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
        // console.log('userId remove', userId)

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
    payload: { senderId: string; receiverId: string; text: string },

  ) {
    console.log('payload', payload)
    const receiverSocketId = this.getUserSocketId(payload.receiverId);
    if (receiverSocketId) {
      // Mengirim pesan hanya ke user dengan receiverId
      this.server.to(receiverSocketId).emit('getMessage', {
        senderId: payload.senderId,
        text: payload.text,
      });
    }
  }
}
