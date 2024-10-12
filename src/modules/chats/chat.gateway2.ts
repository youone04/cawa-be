//v2
import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UsersService } from '../users/users.service';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    private activeUsers: Map<string, string> = new Map(); // userId -> socketId mapping
  
    constructor(private usersService: UsersService) {}
  
    // Ketika user terhubung ke socket
    async handleConnection(client: Socket) {
      const userId = client.handshake.query.userId as string;  
      // Tambahkan user ke dalam daftar aktif
      this.activeUsers.set(userId, client.id); // 1. 7f login dan aktif (contoh)


      
      // Kirim notifikasi ke semua teman bahwa user ini online
      const friends = await this.usersService.getFriendsOnline(userId);//2. cari teman 7f (contoh)
      console.log('friends',friends)
      console.log('this.activeUsers',this.activeUsers)
      const test = ['67027b93785a04d1ababc37d', '67027bc5785a04d1ababc37f']
      test.forEach(friendId => {
        //3. teman 7f itu ada, yaitu 3d (contoh)
        const friendSocketId = this.activeUsers.get(friendId);//apakah 3d aktif?
        console.log('friendSocketId',friendSocketId)
        console.log('userId',userId)
        if (friendSocketId) {//jika 3d aktif kirimkan notifikasi
          this.server.to(friendSocketId).emit('friendOnline', userId);
        }
      });
    }
  
    // Ketika user terputus dari socket
    async handleDisconnect(client: Socket) {
      const userId = [...this.activeUsers.entries()].find(([_, socketId]) => socketId === client.id)?.[0];
      
      if (userId) {
        this.activeUsers.delete(userId);
        
        // Kirim notifikasi ke semua teman bahwa user ini offline
        const friends = await this.usersService.getFriendsOnline(userId);
        friends.forEach(friendId => {
          const friendSocketId = this.activeUsers.get(friendId);
          if (friendSocketId) {
            this.server.to(friendSocketId).emit('friendOffline', userId);
          }
        });
      }
    }
  
    // Contoh event kustom untuk mengirim pesan
    @SubscribeMessage('sendMessage')
    handleMessage(client: Socket, payload: { senderId: string, recipientId: string, message: string }) {
      const recipientSocketId = this.activeUsers.get(payload.recipientId);
      console.log(payload)
      console.log('recipientSocketId',recipientSocketId)
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('receiveMessage', payload);
      }
    }
  }