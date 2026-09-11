import express from "express"
import helmet from "helmet"
import mongoose from "mongoose";
import * as dotenv from "dotenv"
import cors from "cors"

import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js"
import kitRoutes from "./routes/kit.routes.js"
import { connectDB } from "./config/db.js";
dotenv.config();
const app = express()
app.use(helmet());

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // store raw body as string
    },
    limit: "50mb",
  })
);

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));





app.use("/api/auth",authRoutes);
app.use("/api/kits",kitRoutes);

// default get
app.get("/health", async (req, res) => {
  res.status(200).json({
    health: "ok",
  });
});

const starServer = () => {
  try {
    connectDB();
    app.listen(process.env.PORT, () =>
      console.log("server has been started")
    );
  } catch (error) {
    console.log(error);
  }
};
starServer();