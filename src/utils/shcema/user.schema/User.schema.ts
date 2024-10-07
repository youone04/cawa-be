import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose";

@Schema()
export class User extends Document {
    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop([{ type: String }])
    friends: string[];

    @Prop([{ type: String }])
    friendRequests: string[]; // Friend requests received

    @Prop([{ type: String }])
    sentFriendRequests: string[]; // Friend requests sent
}

export const UserSchema = SchemaFactory.createForClass(User)