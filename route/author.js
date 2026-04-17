import express from "express";
import parser from "../middleware/cloudinary.js";
import {
  createAuthor,
  loginAuthor,
  logoutAuthor,
  deleteAuthor,
  getAuthorBooks,
  updateAuthorPassword,
  updateAuthorDetails,
} from "../controller/author.js";
import verify from "../middleware/verifyAuthor.js";
const routes = express.Router();

routes.post("/author", parser.single("profileImage"), createAuthor);
routes.post("/author/login", loginAuthor);
routes.post("/author/logout", verify, logoutAuthor);
routes.delete("/author", verify, deleteAuthor);
routes.get("/author/books/:authorId", getAuthorBooks);
routes.put("/author/password", verify, updateAuthorPassword);
routes.put(
  "/author/details",
  parser.single("profileImage"),
  verify,
  updateAuthorDetails,
);

export default routes;
