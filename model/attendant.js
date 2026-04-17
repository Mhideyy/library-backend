import mongoose from "mongoose";

const attendantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      default: "attendant",
    },

    issuedBooks: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Books" },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        borrowedAt: { type: Date },
      },
    ],
    recievedBooks: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Books" },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        returnedAt: { type: Date },
      },
    ],
    totalBooksRecieved: {
      type: Number,
      default: 0,
    },

    totalBooksIssued: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const attendant = mongoose.model("Attendant", attendantSchema);

export default attendant;
