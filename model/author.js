import mongoose from "mongoose";

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        default: [],
      },
    ],
    role: {
      type: String,
      default: "author",
    },
    totalBooks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const author = mongoose.model("Author", authorSchema);

export default author;
