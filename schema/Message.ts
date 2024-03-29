import mongoose from "mongoose";

interface MessageFields {
  username: string;
  message: string;
  avatar_path: string;
  date: Date;
  image_path: string;
}

const MessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  avatar_path: String,
  date: { type: Date, default: new Date() },
  image_path: String,
});

export default mongoose.model<MessageFields>("Message", MessageSchema);
