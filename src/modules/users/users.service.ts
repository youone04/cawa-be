import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PinService } from 'src/common/pin.service';
import { User } from 'src/utils/shcema/user.schema/User.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async createUser(username: string, email: string, password: string): Promise<any> {
    const pin = new PinService().generatePin(24);
    const newUser = new this.userModel({ username, email, password, pin });
    return newUser.save();
  }

  async login(username: string, password: string): Promise<any> {
    try {
      const resLogin = this.userModel.findOne({ username, password })
        .select({ _id: 1, username: 1, email: 1 }).exec();
      const isLogin = await resLogin

      if (isLogin) {
        return {
          status: 200,
          message: 'Login success',
          data: isLogin
        }

      } else {
        return {
          status: 401,
          message: 'Invalid username or password'

        }
      }

    } catch (err) {
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

    // 1. $unwind :
    // before: "friendRequests": [
    //         "670f3776a970eb4dbb02d57c",
    //          "670ef9a2385761c4723f50e7"
    //     ],

    // after: 
  //   [
  //     {
  //         "_id": "670ef991385761c4723f50e5",
  //         "username": "youone",
  //         "email": "youone@gmail.com",
  //         "pin": "59D175",
  //         "password": "123",
  //         "friends": [],
  //         "friendRequests": "670f3776a970eb4dbb02d57c",
  //         "sentFriendRequests": [],
  //         "__v": 2
  //     },
  //     {
  //         "_id": "670ef991385761c4723f50e5",
  //         "username": "youone",
  //         "email": "youone@gmail.com",
  //         "pin": "59D175",
  //         "password": "123",
  //         "friends": [],
  //         "friendRequests": "670ef9a2385761c4723f50e7",
  //         "sentFriendRequests": [],
  //         "__v": 2
  //     }
  // ]

    // 2. $lookup (join jika dalam sql)
    // untuk debug, bisa di komen satu satu gimana hasilnya



    const user = await this.userModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(userId) }  // Cari user berdasarkan ID
      }
      ,
      {
        $unwind: '$friendRequests'  // Pisahkan friendRequests array menjadi elemen individual
      }
      ,
      {
        $addFields: {  // Konversi friendRequests ke ObjectId
          friendRequests: { $toObjectId: '$friendRequests' }//dari data parent
        }
      }
      ,
      {
        $lookup: { //join
          from: 'users',  // Koleksi users tempat kita akan mencari data teman
          localField: 'friendRequests',  // Field friendRequests yang berisi daftar ID teman
          foreignField: '_id',  // Field _id di koleksi users
          as: 'friendInfo'  // Nama hasil join
        }
      },
      {
        $unwind: '$friendInfo'  // Pisahkan array friendInfo menjadi objek individual
      },
      {
        $project: {
          _id: '$friendInfo._id',  // Ambil _id dari user di friendRequests
          username: '$friendInfo.username'  // Ambil username dari user di friendRequests
        }
      }
    ])
    .exec();
    return user    
  }

  //TODO:
  async getSentFriendRequests(userId: string): Promise<string[]> {
    // const user = await this.userModel.findById(userId).exec();
    // return user.sentFriendRequests;

    const user = await this.userModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(userId) }  // Cari user berdasarkan ID
      }
      ,
      {
        $unwind: '$sentFriendRequests'  // Pisahkan friendRequests array menjadi elemen individual
      }
      ,
      {
        $addFields: {  // Konversi friendRequests ke ObjectId
          sentFriendRequests: { $toObjectId: '$sentFriendRequests' }//dari data parent
        }
      }
      ,
      {
        $lookup: {//join
          from: 'users',  // Koleksi users tempat kita akan mencari data teman
          localField: 'sentFriendRequests',  // Field friendRequests yang berisi daftar ID teman
          foreignField: '_id',  // Field _id di koleksi users
          as: 'friendInfo'  // Nama kolom join
        }
      },
      {
        $unwind: '$friendInfo'  // Pisahkan array friendInfo menjadi objek individual
      },
      {
        $project: {
          _id: '$friendInfo._id',  // Ambil _id dari user di sentFriendRequests
          username: '$friendInfo.username'  // Ambil username dari user di sentFriendRequests
        }
      }
      
    ])

    return user

    
  }

  async getProfile(idUser: string): Promise<User> {
    return await this.getUserById(idUser);

  }

  async getUserByPin(userId: string, pin: string): Promise<any> {
    const result = await this.userModel.aggregate([
      {
        $match: { pin }
      },
      {
        $project: {
          _id: 1,
          isFriend: {
            $cond: { if: { $in: [userId, "$friends"] }, then: true, else: false }
          },
          isSentRequest: {
            $cond: { if: { $in: [userId, "$friendRequests"] }, then: true, else: false }
          },
          friends: 1,
          username: 1,
          name: 1,
          email: 1

        }
      }
    ]);

    return {
      status: 200,
      data: result[0] || {}
    };
  }
}

