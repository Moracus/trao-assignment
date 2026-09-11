import mongoose from "mongoose";
const DB_NAME = process.env.DB_NAME ||"test"
export const connectDB = () => {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(process.env.MONGO_URI, { dbName:DB_NAME })
    .then(() => console.log("Monodb connected"))
    .catch((err) => {
      console.error("faled to connect");
      console.error(err);
    });
};
