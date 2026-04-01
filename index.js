import express, { json } from "express";
import mongoose from "mongoose";
import cookies from "cookie-parser";
import dotenv from "dotenv";

import authorRoute from "./route/author.js";
import attendantRoute from "./route/attendant.js";
import studentRoute from "./route/student.js";
import bookRoute from "./route/books.js";

dotenv.config();

mongoose
  .connect(process.env.MONGOURL)
  .then(() => console.log("connected to MongoDB"))
  .catch((err) => console.log(err));

const app = express();

app.use(json());
app.use(cookies());
app.use(authorRoute);
app.use(attendantRoute);
app.use(studentRoute);
app.use(bookRoute);

app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
