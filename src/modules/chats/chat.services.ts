import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from 'src/utils/shcema/chat.schema/Chat.schema';

@Injectable()
export class ChatsService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<Chat>) {}

  async sendMessage(from: string, to: string, message: string): Promise<Chat> {
    const newMessage = new this.chatModel({ from, to, message });
    return newMessage.save();
  }

  async getMessages(userId: string, friendId: string): Promise<Chat[]> {
    return this.chatModel.find({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId }
      ]
    }).exec();
  }

  async getRecentChats(userId: string) {
    return this.chatModel.aggregate([
      {
        $match: {
          $or: [
            { from: userId },
            { to: userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$from', userId] }, '$to', '$from'
            ]
          },
          lastMessage: { $last: '$message' },
          lastTimestamp: { $last: '$timestamp' }
        }
      },
      {
        $addFields: {
          friendId: { $toObjectId: '$_id' }  // Konversi _id ke ObjectId jika diperlukan
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friendId',
          foreignField: '_id',
          as: 'friendData'
        }
      },
      {
        $unwind: '$friendData'
      },
      {
        $project: {
          _id: 0,
          friendId: '$_id',
          username: '$friendData.username',
          lastMessage: 1,
          lastTimestamp: 1
        }
      }
    ]).exec();
  }
  
}
