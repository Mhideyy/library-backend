import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
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
    borrowedBooks: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Books" },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "Author" },
        attendant: { type: mongoose.Schema.Types.ObjectId, ref: "Attendant" },
        borrowedAt: { type: Date, default: Date.now },
      },
    ],
    returnedBooks: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Books" },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "Author" },
        attendant: { type: mongoose.Schema.Types.ObjectId, ref: "Attendant" },
        borrowedAt: { type: Date },
        returnedAt: { type: Date, default: Date.now },
      },
    ],

    role: {
      type: String,
      default: "student",
    },
  },
  { timestamps: true },
);

const student = mongoose.model("Student", studentSchema);

export default student;
