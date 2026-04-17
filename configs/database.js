import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect(process.env.MONGOURL)
  .then(() => console.log("connected to MongoDB"))
  .catch((err) => console.log(err));

export default mongoose;
