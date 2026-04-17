import express, { json } from "express";
import mongoose from "./configs/database.js";
import cookies from "cookie-parser";

import authorRoute from "./route/author.js";
import attendantRoute from "./route/attendant.js";
import studentRoute from "./route/student.js";
import bookRoute from "./route/books.js";

// database connection
mongoose;

// create express app
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
