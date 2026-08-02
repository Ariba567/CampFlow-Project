import mongoose, { Document, Schema, Model } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-().]{7,20}$/, "Please provide a valid phone number"],
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
      minlength: [3, "Topic must be at least 3 characters"],
      maxlength: [200, "Topic cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Contact: Model<IContact> = mongoose.model<IContact>("Contact", contactSchema);
export default Contact;
