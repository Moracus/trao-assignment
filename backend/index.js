import express from "express"
import helmet from "helmet"
import mongoose from "mongoose";
import * as dotenv from "dotenv"


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


const DB_NAME = process.env.DB_NAME || "test";

const connectDB = () => {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(process.env.MONGO_URI, { dbName: DB_NAME })
    .then(() => console.log("Monodb connected"))
    .catch((err) => {
      console.error("faled to connect");
      console.error(err);
    });
};


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