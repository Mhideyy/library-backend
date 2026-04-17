import express from "express";
import parser from "../middleware/cloudinary.js";
import {
  createAttendant,
  loginAttendant,
  logoutAttendant,
  deleteAttendant,
  getAttendants,
  getAttendantById,
  updateAttendantPassword,
  updateAttendantDetails,
} from "../controller/attendant.js";
import verify from "../middleware/verifyAttendant.js";
// import routes from "./author.js";

const routes = express.Router();
routes.post("/attendant", parser.single("profileImage"), createAttendant);
routes.post("/attendant/login", loginAttendant);
routes.post("/attendant/logout", verify, logoutAttendant);
routes.delete("/attendant", verify, deleteAttendant);
routes.get("/attendants", getAttendants);
routes.get("/attendant/:id", getAttendantById);
routes.put("/attendant/password", verify, updateAttendantPassword);
routes.put(
  "/attendant/details",
  parser.single("profileImage"),
  verify,
  updateAttendantDetails,
);

export default routes;
