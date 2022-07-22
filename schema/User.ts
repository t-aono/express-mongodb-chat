import mongoose from "mongoose";

export interface UserFields {
  _id: string;
  username: string;
  password: string;
  date: Date;
  avatar_path: string;
}

const User = new mongoose.Schema({
  username: String,
  password: String,
  date: { type: Date, default: new Date() },
  avatar_path: String,
});

const UserModel = mongoose.model<UserFields>("User", User);

export default UserModel;
