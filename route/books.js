import express from "express";
import parser from "../middleware/cloudinary.js";
import {
  updateBook,
  getBookById,
  getBooks,
  deleteBook,
  createBooks,
} from "../controller/books.js";
import verifyAuthor from "../middleware/verifyAuthor.js";
const routes = express.Router();

routes.post("/books", parser.single("coverImage"), verifyAuthor, createBooks);
routes.get("/books", getBooks);
routes.get("/books/:id", getBookById);
routes.put("/books/:id", parser.single("coverImage"), verifyAuthor, updateBook);
routes.delete("/books/:id", verifyAuthor, deleteBook);

export default routes;
