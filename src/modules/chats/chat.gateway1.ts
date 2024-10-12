//1

import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway(8900, {
    cors: {
      origin: '*',
    },
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    // Menggunakan Map untuk menampung user data
    private users: Map<string, string> = new Map(); // key: userId, value: socketId
  
    handleConnection(_socket: Socket) {
      console.log('a user connected...');
    }
  
    handleDisconnect(socket: Socket) {
      console.log('a user disconnected!');
      this.removeUserBySocketId(socket.id);
      this.server.emit('getUsers', Array.from(this.users.keys()));
    }
  
    private addUser(userId: string, socketId: string) {
      // Menambahkan user dengan userId sebagai key dan socketId sebagai value
      this.users.set(userId, socketId);
    }
  
    private removeUserBySocketId(socketId: string) {
      // Mencari userId berdasarkan socketId dan menghapusnya
      for (const [userId, sid] of this.users.entries()) {
        if (sid === socketId) {
          this.users.delete(userId);
          break;
        }
      }
      console.log(this.users)
    }
  
    private getUserSocketId(userId: string): string | undefined {
      // Mengambil socketId berdasarkan userId
      return this.users.get(userId);
    }
  
    @SubscribeMessage('addUser')
    handleAddUser(client: Socket, userId: string) {
      this.addUser(userId, client.id);
      // Mengirimkan semua user yang tersimpan dalam bentuk array
      console.log(this.users)
      this.server.emit('getUsers', Array.from(this.users.keys()));
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
  