import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/utils/shcema/user.schema/User.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(username: string, email: string, password: string): Promise<User> {
    const newUser = new this.userModel({ username, email, password});
    return newUser.save();
  }

  async login(username: string, password: string): Promise<any> {
   try{
    const resLogin =  this.userModel.findOne({ username, password })
    .select({ _id: 1, username: 1, email: 1}).exec();
    const isLogin = await resLogin

    if(isLogin){
      return {
        status: 200,
        message: 'Login success',
        data: isLogin
      }

    }else{
      return {
        status: 401,
        message: 'Invalid username or password'
  
      }
    }

  }catch(err){
     throw err
  }
   }

//   mencari data by userId
  async getUserById(userId: string): Promise<User> {
    return this.userModel.findById(userId).exec();
  }

  async sendFriendRequest(userId: string, targetUserId: string): Promise<User> {
    const user = await this.getUserById(userId);
    const targetUser = await this.getUserById(targetUserId);

    if (!targetUser.friendRequests.includes(userId)) {
      targetUser.friendRequests.push(userId);
      await targetUser.save();
    }

    if (!user.sentFriendRequests.includes(targetUserId)) {
      user.sentFriendRequests.push(targetUserId);
      await user.save();
    }

    return user;
  }

  async acceptFriendRequest(userId: string, friendId: string): Promise<User> {
    const user = await this.getUserById(userId);
    const friend = await this.getUserById(friendId);

    user.friends.push(friendId);
    friend.friends.push(userId);

    user.friendRequests = user.friendRequests.filter(id => id !== friendId);
    friend.sentFriendRequests = friend.sentFriendRequests.filter(id => id !== userId);

    await user.save();
    await friend.save();

    return user;
  }

  // Mendapatkan daftar ID teman dari pengguna
  async getFriendsOnline(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('friends').exec();
    return user.friends;  // Pastikan hanya mengembalikan array 'friends'
  }

  async getFriends(userId: string): Promise<User[]> {
    const user = await this.getUserById(userId);
    return this.userModel.find({ _id: { $in: user.friends } }).exec();
  }

  async getFriendRequests(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).exec();
    return user.friendRequests;
  }

  async getSentFriendRequests(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).exec();
    return user.sentFriendRequests;
  }
  
  
}


