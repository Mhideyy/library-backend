import express from "express";
import {
  updateBook,
  getBookById,
  getBooks,
  createBooks,
} from "../controller/books.js";
import verifyAuthor from "../middleware/verifyAuthor.js";
const routes = express.Router();

routes.post("/books", verifyAuthor, createBooks);
routes.get("/books", getBooks);
routes.get("/books/:id", getBookById);
routes.put("/books/:id", verifyAuthor, updateBook);

export default routes;
