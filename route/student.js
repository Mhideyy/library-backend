import express from "express";
import parser from "../middleware/cloudinary.js";
import {
  createStudent,
  loginStudent,
  logoutStudent,
  deleteStudent,
  borrowBook,
  returnBook,
  getBorrowedBooks,
  updateStudentPassword,
  updateStudentDetails,
} from "../controller/student.js";
import verify from "../middleware/verify.js";
import verifyAttendant from "../middleware/verifyAttendant.js";

const routes = express.Router();

routes.post("/student", parser.single("profileImage"), createStudent);
routes.post("/student/login", loginStudent);
routes.post("/student/logout", verify, logoutStudent);
routes.delete("/student", verify, deleteStudent);
routes.post("/student/borrow", verify, verifyAttendant, borrowBook);
routes.post("/student/return", verify, verifyAttendant, returnBook);
routes.get("/student/borrowedBooks", verify, getBorrowedBooks);
routes.put("/student/password", verify, updateStudentPassword);
routes.put(
  "/student/details",
  parser.single("profileImage"),
  verify,
  updateStudentDetails,
);

export default routes;
