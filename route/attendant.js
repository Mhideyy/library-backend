import express from "express";
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
routes.post("/attendant", createAttendant);
routes.post("/attendant/login", loginAttendant);
routes.post("/attendant/logout", verify, logoutAttendant);
routes.delete("/attendant/:id", verify, deleteAttendant);
routes.get("/attendants", getAttendants);
routes.get("/attendant/:id", getAttendantById);
routes.put("/attendant/password", verify, updateAttendantPassword);
routes.put("/attendant/details", verify, updateAttendantDetails);

export default routes;
